// SpotAlert → AWS S3 + Rekognition + SES test connector
// Node 18/20. Install deps first:
// npm i @aws-sdk/client-s3 @aws-sdk/client-rekognition @aws-sdk/client-ses @aws-sdk/s3-request-presigner dotenv

import 'dotenv/config';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  S3Client, PutObjectCommand, GetObjectCommand
} from '@aws-sdk/client-s3';
import {
  RekognitionClient,
  CreateCollectionCommand,
  ListCollectionsCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand
} from '@aws-sdk/client-rekognition';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const {
  AWS_REGION,
  S3_BUCKET,
  REKOG_COLLECTION_ID,
  SES_FROM_EMAIL,
  SES_TO_EMAIL,
  ALERT_SUBJECT,
  MATCH_THRESHOLD = 92
} = process.env;

// --- clients
const s3 = new S3Client({ region: AWS_REGION });
const rekog = new RekognitionClient({ region: AWS_REGION });
const ses = new SESClient({ region: AWS_REGION });

// --- helpers
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function ensureCollection() {
  const listed = await rekog.send(new ListCollectionsCommand({}));
  if (!listed.CollectionIds?.includes(REKOG_COLLECTION_ID)) {
    await rekog.send(new CreateCollectionCommand({ CollectionId: REKOG_COLLECTION_ID }));
    console.log(`✔ Created Rekognition collection: ${REKOG_COLLECTION_ID}`);
  } else {
    console.log(`✔ Using Rekognition collection: ${REKOG_COLLECTION_ID}`);
  }
}

async function uploadToS3(localPath, key) {
  const body = await readFile(localPath);
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: 'image/jpeg'
  }));
  console.log(`✔ Uploaded to s3://${S3_BUCKET}/${key}`);
}

async function presignS3(key, expiresIn = 60 * 60) {
  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

// Index a KNOWN face (run once per person)
//   node spotalert_aws_link.js index ./known/john.jpg john-123
async function indexKnownFace(localImg, externalId = `face-${Date.now()}`) {
  const key = `known_faces/${path.basename(localImg)}`;
  await uploadToS3(localImg, key);

  const imgBytes = await readFile(localImg);
  const res = await rekog.send(new IndexFacesCommand({
    CollectionId: REKOG_COLLECTION_ID,
    ExternalImageId: externalId,
    DetectionAttributes: [],
    Image: { Bytes: imgBytes }
  }));

  const faces = res.FaceRecords?.map(r => r.Face?.FaceId) || [];
  console.log(`✔ Indexed ${faces.length} face(s). ExternalId=${externalId}`);
}

// Detect UNKNOWN faces → email alert if no confident match
//   node spotalert_aws_link.js detect ./frames/door_1.jpg
async function detectUnknown(localImg) {
  await ensureCollection();

  // Upload frame to S3
  const key = `uploads/${Date.now()}_${path.basename(localImg)}`;
  await uploadToS3(localImg, key);
  const viewUrl = await presignS3(key); // link for email

  // Search against collection
  const imgBytes = await readFile(localImg);
  const search = await rekog.send(new SearchFacesByImageCommand({
    CollectionId: REKOG_COLLECTION_ID,
    Image: { Bytes: imgBytes },
    FaceMatchThreshold: Number(MATCH_THRESHOLD),
    MaxFaces: 1
  }));

  const top = search.FaceMatches?.[0];
  if (top && top.Similarity >= Number(MATCH_THRESHOLD)) {
    console.log(`ℹ Known face matched: FaceId=${top.Face.FaceId} Similarity=${top.Similarity.toFixed(1)}%`);
    return { status: 'known', similarity: top.Similarity };
  }

  // No solid match → send email alert
  await sendAlertEmail(viewUrl);
  console.log('🚨 Unknown face — alert email sent.');
  return { status: 'unknown' };
}

async function sendAlertEmail(imageUrl) {
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111">
      <h2>⚠️ SpotAlert — Unknown Person Detected</h2>
      <p>Time: ${new Date().toLocaleString()}</p>
      <p><a href="${imageUrl}" target="_blank">Open snapshot</a> (link valid ~1 hour)</p>
      <img src="${imageUrl}" alt="Snapshot" style="max-width:520px;border-radius:8px;margin-top:10px"/>
      <p style="color:#666;font-size:12px;margin-top:20px">This message was sent by SpotAlert via Amazon SES.</p>
    </div>
  `;
  const cmd = new SendEmailCommand({
    Destination: { ToAddresses: [SES_TO_EMAIL] },
    Source: SES_FROM_EMAIL,
    Message: {
      Subject: { Data: process.env.ALERT_SUBJECT || '[SpotAlert] Unknown person detected' },
      Body: {
        Html: { Data: html }
      }
    }
  });
  await ses.send(cmd);
}

// --- CLI
(async () => {
  try {
    const [,, action, imgPath, externalId] = process.argv;

    if (!action || !['detect','index'].includes(action)) {
      console.log(`Usage:
  node spotalert_aws_link.js index  ./known/person.jpg  person-123
  node spotalert_aws_link.js detect ./frames/snapshot.jpg
`);
      process.exit(0);
    }

    await ensureCollection();

    if (action === 'index') {
      if (!imgPath) throw new Error('Provide path to known face image.');
      await indexKnownFace(imgPath, externalId);
    } else if (action === 'detect') {
      if (!imgPath) throw new Error('Provide path to frame image.');
      await detectUnknown(imgPath);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();

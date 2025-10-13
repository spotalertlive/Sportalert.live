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

const s3 = new S3Client({ region: AWS_REGION });
const rekog = new RekognitionClient({ region: AWS_REGION });
const ses = new SESClient({ region: AWS_REGION });

async function ensureCollection() {
  const listed = await rekog.send(new ListCollectionsCommand({}));
  if (!listed.CollectionIds?.includes(REKOG_COLLECTION_ID)) {
    await rekog.send(new CreateCollectionCommand({ CollectionId: REKOG_COLLECTION_ID }));
    console.log(`✔ Created Rekognition collection: ${REKOG_COLLECTION_ID}`);
  } else console.log(`✔ Using Rekognition collection: ${REKOG_COLLECTION_ID}`);
}

async function uploadToS3(localPath, key) {
  const body = await readFile(localPath);
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET, Key: key, Body: body, ContentType: 'image/jpeg'
  }));
  console.log(`✔ Uploaded to s3://${S3_BUCKET}/${key}`);
}

async function presignS3(key, expiresIn = 60 * 60) {
  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export async function indexKnownFace(localImg, externalId = `face-${Date.now()}`) {
  await ensureCollection();
  const key = `known_faces/${path.basename(localImg)}`;
  await uploadToS3(localImg, key);
  const imgBytes = await readFile(localImg);
  const res = await rekog.send(new IndexFacesCommand({
    CollectionId: REKOG_COLLECTION_ID,
    ExternalImageId: externalId,
    Image: { Bytes: imgBytes }
  }));
  const faces = res.FaceRecords?.map(r => r.Face?.FaceId) || [];
  console.log(`✔ Indexed ${faces.length} face(s). ExternalId=${externalId}`);
}

export async function detectUnknown(localImg) {
  await ensureCollection();
  const key = `uploads/${Date.now()}_${path.basename(localImg)}`;
  await uploadToS3(localImg, key);
  const viewUrl = await presignS3(key);
  const imgBytes = await readFile(localImg);

  const search = await rekog.send(new SearchFacesByImageCommand({
    CollectionId: REKOG_COLLECTION_ID,
    Image: { Bytes: imgBytes },
    FaceMatchThreshold: Number(MATCH_THRESHOLD),
    MaxFaces: 1
  }));

  const top = search.FaceMatches?.[0];
  if (top && top.Similarity >= Number(MATCH_THRESHOLD)) {
    console.log(`ℹ Known face matched: ${top.Similarity.toFixed(1)}%`);
    return { status: 'known', similarity: top.Similarity };
  }

  await sendAlertEmail(viewUrl);
  console.log('🚨 Unknown face — alert email sent.');
  return { status: 'unknown' };
}

async function sendAlertEmail(imageUrl) {
  const html = `
    <div style="font-family:Arial;color:#111">
      <h2>⚠️ SpotAlert — Unknown Person Detected</h2>
      <p>Time: ${new Date().toLocaleString()}</p>
      <p><a href="${imageUrl}" target="_blank">Open snapshot</a> (valid 1 hour)</p>
      <img src="${imageUrl}" style="max-width:520px;border-radius:8px;margin-top:10px"/>
      <p style="color:#666;font-size:12px;margin-top:20px">
        This message was sent by SpotAlert via Amazon SES.
      </p>
    </div>`;
  const cmd = new SendEmailCommand({
    Destination: { ToAddresses: [SES_TO_EMAIL] },
    Source: SES_FROM_EMAIL,
    Message: {
      Subject: { Data: ALERT_SUBJECT || '[SpotAlert] Unknown person detected' },
      Body: { Html: { Data: html } }
    }
  });
  await ses.send(cmd);
}

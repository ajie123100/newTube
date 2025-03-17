import { eq } from "drizzle-orm";
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
  VideoAssetDeletedWebhookEvent,
} from "@mux/mux-node/resources/webhooks";
import { headers } from "next/headers";
import { mux } from "@/lib/mux";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { UTApi } from "uploadthing/server";

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET;

type WebhookEvent =
  | VideoAssetCreatedWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetTrackReadyWebhookEvent
  | VideoAssetDeletedWebhookEvent;

export const POST = async (request: Request) => {
  if (!SIGNING_SECRET) throw new Error("MUX_WEBHOOK_SECRET not found");

  const headersPayload = await headers();
  const muxSignature = headersPayload.get("mux-signature");
  if (!muxSignature) return new Response("No signature found", { status: 401 });

  const payload = await request.json();
  const body = JSON.stringify(payload);
  mux.webhooks.verifySignature(
    body,
    {
      "mux-signature": muxSignature,
    },
    SIGNING_SECRET
  );
  switch (payload.type as WebhookEvent["type"]) {
    case "video.asset.created": {
      console.log(1);
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"];
      if (!data.upload_id) {
        return new Response("No upload ID found", { status: 400 });
      }
      console.log("Creating Video", { uploadId: data.upload_id });
      await db
        .update(videos)
        .set({ muxAssetId: data.id, muxStatus: data.status })
        .where(eq(videos.muxUploadId, data.upload_id));

      break;
    }
    case "video.asset.ready": {
      console.log(2);
      const data = payload.data as VideoAssetReadyWebhookEvent["data"];
      const playbackId = data.playback_ids?.[0].id;

      if (!data.upload_id) {
        return new Response("Missing Upload Id", { status: 400 });
      }
      console.log("Ready Video", { uploadId: data.upload_id });
      if (!playbackId) {
        return new Response("Missing Playback Id", { status: 400 });
      }

      const video = await db
        .select()
        .from(videos)
        .where(eq(videos.muxUploadId, data.upload_id));

      if (video.length === 0) {
        // 如果视频不存在，说明可能已被删除，直接返回成功响应
        console.log("Video not found, possibly deleted", {
          uploadId: data.upload_id,
        });
        return new Response("OK", { status: 200 });
      }

      // 检查视频是否已经处理完成，避免重复处理
      // 只有当状态发生变化或playbackId不存在时才继续处理
      if (
        video[0].muxStatus === data.status &&
        video[0].muxPlaybackId === playbackId &&
        video[0].thumbnailUrl &&
        video[0].previewUrl
      ) {
        console.log("Video already processed", { uploadId: data.upload_id });
        return new Response("Video already processed", { status: 200 });
      }

      const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
      const duration = data.duration ? Math.round(data.duration * 1000) : 0;

      const utApi = new UTApi();

      // 检查视频是否有用户自定义缩略图
      const isCustomThumbnail = video[0].isCustomThumbnail;

      let thumbnailKey = video[0].thumbnailKey;
      let thumbnailUrl = video[0].thumbnailUrl;

      // 只有在没有自定义缩略图的情况下才上传新的缩略图
      if (!isCustomThumbnail) {
        // 清理已存在的非自定义缩略图，避免重复上传
        if (video[0].thumbnailKey) {
          await utApi.deleteFiles(video[0].thumbnailKey);
        }

        // 上传新的缩略图
        const uploadedThumbnail = await utApi.uploadFilesFromUrl(
          tempThumbnailUrl
        );
        if (uploadedThumbnail.error) {
          return new Response("Thumbnail upload failed", { status: 500 });
        }
        thumbnailKey = uploadedThumbnail.data.key;
        thumbnailUrl = uploadedThumbnail.data.url;
      }

      // 处理预览图（预览图总是更新，因为它不是用户自定义的）
      if (video[0].previewKey) {
        await utApi.deleteFiles(video[0].previewKey);
      }

      const uploadedPreview = await utApi.uploadFilesFromUrl(tempPreviewUrl);
      if (uploadedPreview.error) {
        return new Response("Preview upload failed", { status: 500 });
      }

      const previewKey = uploadedPreview.data.key;
      const previewUrl = uploadedPreview.data.url;

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
          muxPlaybackId: playbackId,
          muxAssetId: data.id,
          thumbnailUrl,
          thumbnailKey,
          previewUrl,
          previewKey,
          duration,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }
    case "video.asset.errored": {
      console.log(3);
      const data = payload.data as VideoAssetErroredWebhookEvent["data"];

      if (!data.upload_id) {
        return new Response("Missing Upload Id", { status: 400 });
      }
      console.log("Errored Video", { uploadId: data.upload_id });
      await db
        .update(videos)
        .set({ muxStatus: data.status })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }

    case "video.asset.deleted": {
      console.log(4);
      const data = payload.data as VideoAssetDeletedWebhookEvent["data"];

      if (!data.upload_id) {
        return new Response("Missing Upload Id", { status: 400 });
      }

      console.log("Deleting Video", { uploadId: data.upload_id });

      const videoRecords = await db
        .select()
        .from(videos)
        .where(eq(videos.muxUploadId, data.upload_id));
      if (videoRecords.length > 0) {
        const utApi = new UTApi();
        videoRecords.forEach(async (video) => {
          if (video.thumbnailKey) {
            await utApi.deleteFiles(video.thumbnailKey);
          }
          if (video.previewKey) {
            await utApi.deleteFiles(video.previewKey);
          }
          if (video.muxUploadId) {
            await db
              .delete(videos)
              .where(eq(videos.muxUploadId, video.muxUploadId));
          }
        });
      }
      break;
    }

    case "video.asset.track.ready": {
      console.log(5);
      const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
        asset_id: string;
      };

      const assetId = data.asset_id;
      const trackId = data.id;
      const status = data.status;

      if (!assetId) {
        return new Response("Missing Asset ID", { status: 400 });
      }
      console.log("Ready Track", { assetId, trackId });
      await db
        .update(videos)
        .set({
          muxTrackId: trackId,
          muxTrackStatus: status,
        })
        .where(eq(videos.muxAssetId, assetId));
      break;
    }
  }

  return new Response("webhook received", { status: 200 });
};

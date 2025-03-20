// 导入必要的依赖
import { relations } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import {
  boolean,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// 视频反应类型枚举：定义用户对视频的反应类型
export const reactionType = pgEnum("reaction_type", [
  "like", // 点赞
  "dislike", // 踩
]);

// 数据库模式定义
// 该文件定义了整个应用的数据库结构，包括用户、视频、分类、订阅、观看记录和反应等核心功能表
// 使用 PostgreSQL 作为数据库，通过 Drizzle ORM 进行数据库操作

export const playlistVideos = pgTable(
  "playlist_videos",
  {
    playlistId: uuid("playlist_id")
      .references(() => playlists.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "playlist_videos_pk",
      columns: [t.playlistId, t.videoId],
    }),
  ]
);

export const playlistVideoRelations = relations(playlistVideos, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistVideos.playlistId],
    references: [playlists.id],
  }),
  video: one(videos, {
    fields: [playlistVideos.videoId],
    references: [videos.id],
  }),
}));

export const playlists = pgTable("playlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const playlistRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  playlistVideos: many(playlistVideos),
}));

// 用户表：存储应用的用户信息
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(), // 用户唯一标识，自动生成的UUID
    clerkId: text("clerk_id").unique().notNull(), // Clerk认证服务的用户ID
    name: text("name").notNull(), // 用户名称
    imageUrl: text("image_url").notNull(), // 用户头像URL
    bannerUrl: text("banner_url"), // 用户背景图片URL
    bannerKey: text("banner_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(), // 创建时间
    updatedAt: timestamp("updated_at").defaultNow().notNull(), // 更新时间
  },
  (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)]
);

// 定义用户表与其他表的关系
export const userRelations = relations(users, ({ many }) => ({
  videos: many(videos), // 用户发布的视频，一对多关系
  videoViews: many(videoViews), // 用户的观看记录，一对多关系
  videoReactions: many(videoReactions), // 用户的视频反应（点赞/踩），一对多关系
  subscriptions: many(subscriptions, {
    // 用户关注的创作者，多对多关系
    relationName: "subscriptions_viewer_id_fkey",
  }),
  subscribers: many(subscriptions, {
    // 关注该用户的订阅者，多对多关系
    relationName: "subscriptions_creator_id_fkey",
  }),
  comments: many(comments),
  commentReactions: many(commentReactions),
  playlists: many(playlists),
}));

// 订阅表：存储用户之间的关注关系
export const subscriptions = pgTable(
  "subscriptions",
  {
    viewerId: uuid("user_id") // 观众（关注者）的用户ID
      .references(() => users.id, {
        onDelete: "cascade", // 当用户被删除时，级联删除相关的订阅记录
      })
      .notNull(),
    creatorId: uuid("creator_id") // 创作者（被关注者）的用户ID
      .references(() => users.id, {
        onDelete: "cascade", // 当用户被删除时，级联删除相关的订阅记录
      })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(), // 订阅创建时间
    updatedAt: timestamp("updated_at").defaultNow().notNull(), // 订阅更新时间
  },
  (t) => [
    primaryKey({
      name: "subscriptions_pk",
      columns: [t.viewerId, t.creatorId],
    }),
  ]
);

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  viewer: one(users, {
    fields: [subscriptions.viewerId],
    references: [users.id],
    relationName: "subscriptions_viewer_id_fkey",
  }),
  creator: one(users, {
    fields: [subscriptions.creatorId],
    references: [users.id],
    relationName: "subscriptions_creator_id_fkey",
  }),
}));

// 分类表：存储视频的分类信息
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(), // 分类唯一标识
    name: text("name").notNull().unique(), // 分类名称，不可重复
    description: text("description"), // 分类描述
    createdAt: timestamp("created_at").defaultNow().notNull(), // 创建时间
    updatedAt: timestamp("updated_at").defaultNow().notNull(), // 更新时间
  },
  (t) => [uniqueIndex("category_name_idx").on(t.name)]
);

export const categoryRelations = relations(categories, ({ many }) => ({
  videos: many(videos),
}));

// 视频可见性枚举：定义视频的可见范围
export const videoVisibility = pgEnum("video_visibility", [
  "private", // 私有，仅创作者可见
  "public", // 公开，所有用户可见
]);

// 视频表：存储视频的详细信息
export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(), // 视频唯一标识
  title: text("title").notNull(), // 视频标题
  description: text("description"), // 视频描述
  muxStatus: text("mux_status"), // Mux视频处理状态
  muxAssetId: text("mux_asset_id").unique(), // Mux资源ID
  muxUploadId: text("mux_upload_id").unique(), // Mux上传ID
  muxPlaybackId: text("mux_playback_id").unique(), // Mux播放ID
  muxTrackId: text("mux_track_id").unique(), // Mux轨道ID
  muxTrackStatus: text("mux_track_status"), // Mux轨道状态
  thumbnailUrl: text("thumbnail_url"), // 缩略图URL
  thumbnailKey: text("thumbnail_key"), // 缩略图存储键
  isCustomThumbnail: boolean("is_custom_thumbnail").default(false).notNull(), // 是否使用自定义缩略图
  previewUrl: text("preview_url"), // 预览URL
  previewKey: text("preview_key"), // 预览图存储键
  duration: integer("duration").default(0).notNull(), // 视频时长（秒）
  visibility: videoVisibility("visibility").default("private").notNull(), // 视频可见性
  userId: uuid("user_id") // 视频作者ID
    .references(() => users.id, {
      onDelete: "cascade", // 当用户被删除时，级联删除其视频
    })
    .notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    // 视频分类ID
    onDelete: "set null", // 当分类被删除时，将视频的分类设为null
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // 更新时间
});

export const videoSelectSchema = createSelectSchema(videos);
export const videoInsertSchema = createInsertSchema(videos);
export const videoUpdateSchema = createUpdateSchema(videos);

export const videoRelations = relations(videos, ({ one, many }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [videos.categoryId],
    references: [categories.id],
  }),
  views: many(videoViews),
  videoReactions: many(videoReactions),
  comments: many(comments),
  playlistVideos: many(playlistVideos),
}));

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id"),
    videoId: uuid("video_id")
      .references(() => videos.id, {
        onDelete: "cascade",
      })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, {
        onDelete: "cascade",
      })
      .notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
      name: "comments_parent_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const commentRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "comments_parent_id_fkey",
  }),
  replies: many(comments, {
    relationName: "comments_parent_id_fkey",
  }),
  reactions: many(commentReactions),
}));

export const commentSelectSchema = createSelectSchema(comments);
export const commentInsertSchema = createInsertSchema(comments);
export const commentUpdateSchema = createUpdateSchema(comments);

export const commentReactions = pgTable(
  "comment_reactions",
  {
    userId: uuid("user_id")
      .references(() => users.id, {
        onDelete: "cascade",
      })
      .notNull(),
    commentId: uuid("comment_id")
      .references(() => comments.id, {
        onDelete: "cascade",
      })
      .notNull(),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "comment_reactions_pk",
      columns: [t.userId, t.commentId],
    }),
  ]
);

export const commentReactionRelations = relations(
  commentReactions,
  ({ one }) => ({
    user: one(users, {
      fields: [commentReactions.userId],
      references: [users.id],
    }),
    comment: one(comments, {
      fields: [commentReactions.commentId],
      references: [comments.id],
    }),
  })
);

// 视频观看记录表：记录用户观看视频的历史
export const videoViews = pgTable(
  "video_views",
  {
    userId: uuid("user_id") // 观看用户ID
      .references(() => users.id, {
        onDelete: "cascade", // 当用户被删除时，级联删除其观看记录
      })
      .notNull(),
    videoId: uuid("video_id") // 被观看的视频ID
      .references(() => videos.id, {
        onDelete: "cascade", // 当视频被删除时，级联删除相关的观看记录
      })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(), // 观看时间
    updatedAt: timestamp("updated_at").defaultNow().notNull(), // 记录更新时间
  },
  (t) => [
    primaryKey({
      name: "video_views_pk",
      columns: [t.userId, t.videoId],
    }),
  ]
);

export const videoViewRelations = relations(videoViews, ({ one }) => ({
  user: one(users, {
    fields: [videoViews.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [videoViews.videoId],
    references: [videos.id],
  }),
}));

export const videoViewSelectSchema = createSelectSchema(videoViews);
export const videoViewInsertSchema = createInsertSchema(videoViews);
export const videoViewUpdateSchema = createUpdateSchema(videoViews);

// 视频反应表：记录用户对视频的反应（点赞/踩）
export const videoReactions = pgTable(
  "video_reactions",
  {
    userId: uuid("user_id") // 反应用户ID
      .references(() => users.id, {
        onDelete: "cascade", // 当用户被删除时，级联删除其反应记录
      })
      .notNull(),
    videoId: uuid("video_id") // 被反应的视频ID
      .references(() => videos.id, {
        onDelete: "cascade", // 当视频被删除时，级联删除相关的反应记录
      })
      .notNull(),
    type: reactionType("type").notNull(), // 反应类型（点赞/踩）
    createdAt: timestamp("created_at").defaultNow().notNull(), // 反应创建时间
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "video_reactions_pk",
      columns: [t.userId, t.videoId],
    }),
  ]
);

export const videoReactionsRelations = relations(videoReactions, ({ one }) => ({
  user: one(users, {
    fields: [videoReactions.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [videoReactions.videoId],
    references: [videos.id],
  }),
}));

export const videoReactionSelectSchema = createSelectSchema(videoReactions);
export const videoReactionInsertSchema = createInsertSchema(videoReactions);
export const videoReactionUpdateSchema = createUpdateSchema(videoReactions);

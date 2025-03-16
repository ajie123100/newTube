import { db } from '@/db'
import { videos } from '@/db/schema'
import { generateDescription } from '@/lib/ai-generate'
import { serve } from '@upstash/workflow/nextjs'
import { and, eq } from 'drizzle-orm'

const DESCRIPTION_SYSTEM_PROMPT = `Your task is to summarize the transcript of a video. Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necessary for the context.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- ONLY return the summary, no other text, annotations, or comments.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.`

interface InputType {
  userId: string
  videoId: string
}

export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType
  const { userId, videoId } = input

  const video = await context.run('get-video', async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))

    if (!existingVideo) throw new Error('Not found')

    return existingVideo
  })

  const transcript = await context.run('get-transcript', async () => {
    const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`
    const response = await fetch(trackUrl)
    const text = response.text()

    if (!text) throw new Error('Bad request')

    return text
  })

  // const { body } = await context.api.openai.call('generate-description', {
  //   baseURL: process.env.OPENAI_API_KEY_FREE_BASE_URL,
  //   token: process.env.OPENAI_API_KEY_FREE!,
  //   operation: 'chat.completions.create',
  //   body: {
  //     model: 'gpt-3.5-turbo',
  //     messages: [
  //       {
  //         role: 'system',
  //         content: DESCRIPTION_SYSTEM_PROMPT,
  //       },
  //       {
  //         role: 'user',
  //         content: transcript,
  //       },
  //     ],
  //   },
  // })

  const body = await context.run('generate-title', async () => {
    return await generateDescription({
      baseURL: 'https://api.siliconflow.cn/v1/chat/completions',
      token: process.env.SILICONFLOW_KEY!,
      operation: 'chat',
      body: {
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
        messages: [
          {
            role: 'system',
            content: DESCRIPTION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
      },
    })
  })

  const description = body.choices[0]?.message.content

  if (!description) throw new Error('Bad request')

  await context.run('update-video', async () => {
    await db
      .update(videos)
      .set({ description: description || video.description })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)))
  })
})

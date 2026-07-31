'use server';
/**
 * @fileOverview Provides a search functionality for dish tutorials, returning both video and text results.
 *
 * - searchTutorials - A function that searches for tutorials based on a query.
 * - SearchTutorialsInput - The input type for the searchTutorials function.
 * - SearchTutorialsOutput - The return type for the searchTutorials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchTutorialsInputSchema = z.object({
  query: z.string().describe('The search query for the dish or cooking technique.'),
});
export type SearchTutorialsInput = z.infer<typeof SearchTutorialsInputSchema>;

const VideoTutorialSchema = z.object({
  title: z.string().describe('The title of the YouTube video.'),
  channel: z.string().describe('The name of the YouTube channel.'),
  views: z.string().describe('The number of views, formatted as a string (e.g., "1.2M").'),
  thumbnailUrl: z.string().url().describe('The URL for the video thumbnail image.'),
  videoUrl: z.string().url().describe('The URL to watch the video on YouTube.'),
});

const TextTutorialSchema = z.object({
    title: z.string().describe('The title of the recipe or article.'),
    sourceName: z.string().describe('The name of the website or blog (e.g., "Allrecipes", "Food Network").'),
    url: z.string().url().describe('The URL to the recipe or article.'),
    snippet: z.string().describe('A short, enticing snippet from the article.')
})

const SearchTutorialsOutputSchema = z.object({
  videoTutorials: z.array(VideoTutorialSchema).describe('A list of relevant YouTube video tutorials.'),
  textTutorials: z.array(TextTutorialSchema).describe('A list of relevant text-based tutorials or recipes from websites.'),
});
export type SearchTutorialsOutput = z.infer<typeof SearchTutorialsOutputSchema>;

export async function searchTutorials(input: SearchTutorialsInput): Promise<SearchTutorialsOutput> {
  return searchTutorialsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchTutorialsPrompt',
  input: {schema: SearchTutorialsInputSchema},
  output: {schema: SearchTutorialsOutputSchema},
  prompt: `You are a culinary search engine expert. Given a search query for a dish or cooking technique, your task is to find and return a list of the best tutorials available online.

Provide a mix of both video tutorials from YouTube and text-based recipes from popular cooking websites.

For YouTube videos, provide a realistic title, channel name, view count, a valid placeholder thumbnail URL from an image service like picsum.photos, and a valid YouTube video URL.
For text tutorials, provide the recipe title, the source website name, the URL, and a brief, engaging snippet.

Search Query: {{{query}}}

Generate a list of 3 video tutorials and 4 text tutorials.
`,
});

const searchTutorialsFlow = ai.defineFlow(
  {
    name: 'searchTutorialsFlow',
    inputSchema: SearchTutorialsInputSchema,
    outputSchema: SearchTutorialsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

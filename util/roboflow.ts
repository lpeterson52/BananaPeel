// Example imageurl

import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { File, Directory, Paths } from 'expo-file-system';


/**
 * Bare Roboflow detection helper for Expo.
 *
 * Reads an image file URI (for example the `uri` returned by the Expo Camera)
 * as base64 and POSTs it to a Roboflow serverless detection endpoint.
 *
 * Note: This is a minimal implementation intended for dev/prototyping. You
 * should secure API keys and add retries/timeouts for production use.
 */

export type RoboflowOptions = {
	apiKey?: string;
	model?: string; // model slug, e.g. "trash-recycle-compost-etc-etc"
	version?: string; // model version, e.g. "1"
	baseUrl?: string; // optional override for the serverless host
};

export default async function classifyImage(
	imageUri: string,
	options: RoboflowOptions = {}
): Promise<any> {
	const apiKey = options.apiKey ?? '9jGbNti7bCrGcb3792eC';
	const model = options.model ?? 'trash-recycle-compost-etc-etc';
	const version = options.version ?? '1';
	const baseUrl = options.baseUrl ?? 'https://serverless.roboflow.com';

	const url = `${baseUrl}/${model}/${version}`;
	
	try {
		// Read local file (file://...) as base64 using expo-file-system
		// migrate to the new filesystem api using "file" and "directory" classes or import the legacy api from "expo-file-system/legacy"
		const base64 = await new File(imageUri).base64();

		// Try serverless JSON endpoint first (base64 payload)
		try {
			const response = await axios.post(
				url,
				{ image: base64 },
				{
					params: { api_key: apiKey },
					headers: { 'Content-Type': 'application/json' },
				}
			);
			return response.data;
		} catch (err: any) {
			// If the server complains about malformed base64, fall back to multipart upload
			const msg = err?.response?.data ?? err?.message ?? String(err);
			const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
			if (text.toLowerCase().includes('malformed') || text.toLowerCase().includes('base64')) {
				// Fallback: upload as multipart/form-data to the detect endpoint which accepts file uploads
				const detectUrl = `https://detect.roboflow.com/${model}/${version}`;
				const formData = new FormData();
				formData.append('file', {
					uri: imageUri,
					name: 'image.jpg',
					type: 'image/jpeg',
				} as any);

				const uploadResp = await axios.post(detectUrl, formData, {
					params: { api_key: apiKey },
					headers: { 'Content-Type': 'multipart/form-data' },
				});
				return uploadResp.data;
			}

			// rethrow original error if it's not the malformed-base64 case
			throw err;
		}
	} catch (err: any) {
		// Normalize the error to make it easier to handle upstream
		const message = err?.response?.data ?? err?.message ?? String(err);
		throw new Error(`Roboflow detectImage error: ${JSON.stringify(message)}`);
	}
}

/**
 * Usage example:
 *
 * import detectImage from '@/util/roboflow';
 * const result = await detectImage(photo.uri);
 */



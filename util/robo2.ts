import axios from "axios";
import * as ImageManipulator from "expo-image-manipulator";
import * as fs from 'expo-file-system';

const processed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 640 } }],
    {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
    }
);

export default async function detectTrash(imageUri: string) {
    const formData = new FormData();
    base = fs.base64(imageUri);
    formData.append("file", {
        uri: processed.uri,
        name: "image.jpg",
        type: "image/jpeg",
    } as any);

    const response = await axios.post(
        "https://detect.roboflow.com/trash-recycle-compost-etc-etc/1",
        formData,
        {
            params: {
                api_key: "9jGbNti7bCrGcb3792eC",
            },
            headers: {
                "Content-Type": "multipart/form-data",
            },
            timeout: 15000,
        }
    );

    console.log('called api!')
    console.log(response)

    return response.data;
}

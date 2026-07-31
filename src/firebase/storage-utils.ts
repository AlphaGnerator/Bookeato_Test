import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseStorage } from 'firebase/storage';

export async function uploadFile(
    storage: FirebaseStorage, 
    path: string, 
    file: File
): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

export async function uploadPartnerFiles(
    storage: FirebaseStorage,
    partnerId: string,
    files: {
        profilePhoto?: File | null;
        aadhaarPhoto?: File | null;
        contract?: File | null;
    }
) {
    const urls: { [key: string]: string } = {};

    if (files.profilePhoto) {
        urls.profilePhotoUrl = await uploadFile(storage, `partners/${partnerId}/profile.jpg`, files.profilePhoto);
    }
    if (files.aadhaarPhoto) {
        urls.aadhaarPhotoUrl = await uploadFile(storage, `partners/${partnerId}/aadhaar.jpg`, files.aadhaarPhoto);
    }
    if (files.contract) {
        urls.contractUrl = await uploadFile(storage, `partners/${partnerId}/contract.pdf`, files.contract);
    }

    return urls;
}

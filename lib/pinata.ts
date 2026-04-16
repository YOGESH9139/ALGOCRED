import axios from "axios"

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT

/**
 * Uploads a file to IPFS via Pinata
 * @param file The file object to upload
 * @returns The IPFS gateway URL
 */
export const uploadToIPFS = async (file: File): Promise<string> => {
  if (!PINATA_JWT) {
    console.warn("Pinata JWT not configured, using mock IPFS URL for testing")
    // Fallback for development if keys are missing
    return `https://gateway.pinata.cloud/ipfs/QmMockHash${Date.now()}`
  }

  try {
    const formData = new FormData()
    formData.append("file", file)

    const metadata = JSON.stringify({
      name: `algocred-bounty-upload-${Date.now()}`,
    })
    formData.append("pinataMetadata", metadata)

    const options = JSON.stringify({
      cidVersion: 0,
    })
    formData.append("pinataOptions", options)

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "multipart/form-data",
      },
    })

    const ipfsHash = res.data.IpfsHash
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
  } catch (error) {
    console.error("Error uploading to IPFS:", error)
    throw new Error("Failed to upload file to IPFS")
  }
}

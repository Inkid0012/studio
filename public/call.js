
// This is a simplified example for testing purposes.
// In a production app, you would have a more robust UI and error handling.

let client;
let localAudioTrack;

async function acceptCall(channelName, uid) {
    console.log(`Attempting to join channel: ${channelName} with UID: ${uid}`);

    // Use a placeholder App ID for now.
    // In a real application, you should fetch this from a secure server.
    const appId = "5f5749cfcb054a82b4c779444f675284";

    try {
        // Fetch the token from your token server
        const response = await fetch(`https://fizu-agora-token-server.onrender.com/rtc/${channelName}/audience/${uid}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.statusText}`);
        }
        const data = await response.json();
        const token = data.rtcToken;

        console.log("Token fetched successfully:", token);

        // Initialize Agora client
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        // Event listeners for user joining/leaving
        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            if (mediaType === "audio") {
                console.log("Remote user audio published:", user.uid);
                user.audioTrack.play();
            }
        });

        client.on("user-unpublished", user => {
            console.log("Remote user audio unpublished:", user.uid);
        });

        // Join the channel
        await client.join(appId, channelName, token, uid);
        console.log("Successfully joined channel");

        // Create and publish local audio track
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
        console.log("Local audio track published");

        document.getElementById("status").innerText = `In call in channel: ${channelName}`;

    } catch (error) {
        console.error("Agora connection failed:", error);
        document.getElementById("status").innerText = `Error: ${error.message}`;
    }
}

    
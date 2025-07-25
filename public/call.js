
async function acceptCall(channelName, uid) {
    const APP_ID = "5f5749cfcb054a82b4c779444f675284";
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    let localAudioTrack = null;

    console.log("Attempting to accept call...");

    try {
        // Fetch token from the server
        const response = await fetch(`https://fizu-agora-token-server.onrender.com/rtc/${channelName}/audience/${uid}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const token = data.rtcToken;
        console.log("Token fetched successfully.");

        // Join the channel
        await client.join(APP_ID, channelName, token, uid);
        console.log("Joined channel successfully.");

        // Create and publish microphone audio track
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
        console.log("Microphone audio published successfully.");

        // Listen for other users
        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            console.log("Subscribed to remote user " + user.uid);

            if (mediaType === "audio") {
                user.audioTrack.play();
                console.log("Playing remote audio.");
            }
        });

    } catch (error) {
        console.error("Agora connection failed:", error);
    }
}

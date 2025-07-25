async function acceptCall(channelName, uid) {
  const agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  // 1. Fetch token from your server
  const response = await fetch(`https://fizu-agora-token-server.onrender.com/rtc/${channelName}/audience/${uid}`);
  if (!response.ok) {
    alert("Failed to fetch token");
    return;
  }

  const data = await response.json();
  const token = data.rtcToken;

  // 2. Join Agora channel using your real App ID
  try {
    await agoraEngine.join("5f5749cfcb054a82b4c779444f675284", channelName, token, uid);

    // 3. Create and publish local audio track
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    await agoraEngine.publish([localAudioTrack]);

    alert("Call connected 🎉");
  } catch (e) {
    console.error("Join failed", e);
    alert("Call failed to connect");
  }
}

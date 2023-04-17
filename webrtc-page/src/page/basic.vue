<script setup lang="ts">
	import { ref } from 'vue'

	const myVideoRef = ref<HTMLVideoElement>()
	const localStream = ref<MediaStream>()
	const remoteStream = ref<MediaStream>()
	const remoteRef = ref<HTMLVideoElement>()
	const peerA = ref<RTCPeerConnection>()
	const peerB = ref<RTCPeerConnection>()

	const start = async () => {
		console.log('开始获取本地媒体流')
		const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
		myVideoRef.value!.srcObject = stream
		localStream.value = stream
	}
	const call = async () => {
		const videoTracks = localStream.value?.getVideoTracks()
		const audioTracks = localStream.value?.getAudioTracks()

		// 设置ice
		let configuration: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
		peerA.value = new RTCPeerConnection(configuration)
		console.log('创建本地peerconnection成功: peerA')
		peerA.value.addEventListener('icecandidate', onIceCandidateA)

		peerB.value = new RTCPeerConnection(configuration)
		console.log('创建本地peerconnection成功: peerB')

		peerB.value.addEventListener('icecandidate', onIceCandidateB)

		peerA.value.addEventListener('iceconnectionstatechange', onIceStateChangeA)
		peerB.value.addEventListener('iceconnectionstatechange', onIceStateChangeB)

		peerB.value.addEventListener('track', gotRemoteStream)

		localStream.value?.getTracks().forEach((track) => {
			peerA.value?.addTrack(track)
		})
		console.log('把流添加到peer中')

		try {
			console.log('peerA创建offer')
			const offer = await peerA.value.createOffer()
			await onCreateOfferSuccess(offer)
		} catch (e) {}
	}
	//断开连接
	const hangup = () => {
		console.log('结束会话')
		//关闭peerConnA
		peerA.value!.close()
		//关闭peerConnB
		peerB.value!.close()
		//peerConnA置为空
		peerA.value = undefined
		//peerConnB置为空
		peerB.value = undefined
	}

	const gotRemoteStream = (e: RTCTrackEvent) => {
		if (e.streams[0] && remoteRef.value!.srcObject !== e.streams[0]) {
			//取集合第一个元素
			remoteRef.value!.srcObject = e.streams[0]
			remoteStream.value = e.streams[0]
		} else {
			remoteStream.value = new MediaStream()
			remoteStream.value.addTrack(e.track)
			remoteRef.value!.srcObject = remoteStream.value
		}
		console.log('peerConnB开始接收远端流')
	}

	const onCreateOfferSuccess = async (offer: RTCSessionDescriptionInit) => {
		console.log(`peerA创建的offer返回的sdp信息: ${offer.sdp}`)

		try {
			await peerA.value?.setLocalDescription(offer)
			onSetLocalSuccess(peerA.value!)
		} catch (e) {}

		console.log('peerB开始设置远端描述')
		try {
			await peerB.value?.setRemoteDescription(offer)
			onSetRemoteSuccess(peerB.value!)
		} catch (e) {}

		console.log('peerConnB开始创建应答Answer')
		try {
			const answer = await peerB.value!.createAnswer()
			onCreateAnswerSuccess(answer)
		} catch (e) {}
	}

	const onCreateAnswerSuccess = async (answer: RTCSessionDescriptionInit) => {
		console.log(`peerConnB的应答Answer数据:\n${answer.sdp}`)
		console.log('peerConnB设置本地描述开始:setLocalDescription')
		try {
			await peerB.value?.setLocalDescription(answer)
			onSetLocalSuccess(peerB.value!)
		} catch (e) {}

		console.log('peerConnA设置远端描述开始:setRemoteDescription')

		try {
			await peerA.value?.setRemoteDescription(answer)
			onSetRemoteSuccess(peerA.value!)
		} catch (e) {}
	}

	const onIceCandidateA = async (e: RTCPeerConnectionIceEvent) => {
		try {
			if (e.candidate) {
				await peerB.value?.addIceCandidate(e.candidate)
			}
		} catch (error) {}
	}
	const onIceCandidateB = async (e: RTCPeerConnectionIceEvent) => {
		try {
			if (e.candidate) {
				await peerA.value?.addIceCandidate(e.candidate)
			}
		} catch (error) {}
	}
	const onIceStateChangeA = () => {}
	const onIceStateChangeB = () => {}

	const onSetLocalSuccess = async (peer: RTCPeerConnection) => {
		console.log(`设置本地描述完成:setLocalDescription`)
	}
	const onSetRemoteSuccess = async (peer: RTCPeerConnection) => {
		console.log(`设置远端描述完成:setRemoteDescription`)
	}
</script>

<template>
	<div class="container">
		<h1>RTCPeerConnection实例</h1>
		<video ref="myVideoRef" playsinline autoplay muted></video>
		<video ref="remoteRef" playsinline autoplay muted></video>

		<div>
			<button @click="start">开始</button>
			<button @click="call">呼叫</button>
			<button @click="hangup">挂断</button>
		</div>
	</div>
</template>

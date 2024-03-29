import React, { ChangeEvent, useState } from 'react'

const BINARY_DIMENSION_X = 36000
const DIMENSION_Y = 17999
const CHUNK_SIZE = 36000 * 17999
const RESIZE_FACTOR = 16

const BinaryFileReader: React.FC = () => {
	const [isReading, setIsReading] = useState(false)
	const canvasRef = React.useRef<HTMLCanvasElement>(null)

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			setIsReading(true)
			const canvas = canvasRef.current
			if (!canvas) return
			const context = canvas.getContext('2d')
			if (!context) return

			try {
				let currentPosition = 0
				while (currentPosition < file.size) {
					const blobChunk = file.slice(currentPosition, CHUNK_SIZE)
					const arrayBuffer = await blobToArrayBuffer(blobChunk)
					drawImageData(context, arrayBuffer)
					currentPosition += CHUNK_SIZE
				}
			} catch (error) {
				console.error('Error reading file:', error)
			} finally {
				setIsReading(false)
			}
		}
	}

	const drawImageData = (
		context: CanvasRenderingContext2D,
		arrayBuffer: ArrayBuffer
	) => {
		const imageData = context.createImageData(
			BINARY_DIMENSION_X / RESIZE_FACTOR,
			DIMENSION_Y / RESIZE_FACTOR
		)
		const data = new Uint8ClampedArray(arrayBuffer)

		let finalIndex = 0
		for (let y = 0; y < DIMENSION_Y; y += RESIZE_FACTOR) {
			for (let x = 0; x < BINARY_DIMENSION_X; x += RESIZE_FACTOR) {
				const pixelIndex = (y * BINARY_DIMENSION_X + x) * 1
				const pixelData = data[pixelIndex]
				const color = getSeaColor(pixelData)

				if (pixelData === 255) {
					imageData.data[finalIndex++] = 0 // R
					imageData.data[finalIndex++] = 0 // G
					imageData.data[finalIndex++] = 0 // B
					imageData.data[finalIndex++] = 0 // Alpha
				} else {
					imageData.data[finalIndex++] = color.r // R
					imageData.data[finalIndex++] = color.g // G
					imageData.data[finalIndex++] = color.b // B
					imageData.data[finalIndex++] = 255 // Alpha
				}
			}
		}

		context.putImageData(imageData, 0, 0)
	}

	const getSeaColor = (temperature: number) => {
		const coldColor = { r: 0, g: 0, b: 255 }
		const hotColor = { r: 255, g: 0, b: 0 }

		const ratio = temperature / 110
		const r = Math.round(coldColor.r + (hotColor.r - coldColor.r) * ratio)
		const g = Math.round(coldColor.g + (hotColor.g - coldColor.g) * ratio)
		const b = Math.round(coldColor.b + (hotColor.b - coldColor.b) * ratio)

		return { r, g, b }
	}

	const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => {
				if (reader.result instanceof ArrayBuffer) {
					resolve(reader.result)
				} else {
					reject(new Error('Failed to read blob as ArrayBuffer.'))
				}
			}
			reader.onerror = () => {
				reject(new Error('Error reading blob.'))
			}
			reader.readAsArrayBuffer(blob)
		})
	}

	return (
		<div style={{ display: 'flex', justifyContent: 'center' }}>
			<input type='file' onChange={handleFileChange} disabled={isReading} />
			{isReading && <p>Reading file...</p>}
			<div>
				<img
					src='https://moweb.azureedge.net/careers/heat-map-task/empty-map.jpg'
					alt='emptyMap'
					style={{
						width: BINARY_DIMENSION_X / RESIZE_FACTOR,
						height: DIMENSION_Y / RESIZE_FACTOR,
						position: 'absolute',
						margin: 'auto',
					}}
				/>
			</div>
			<canvas
				ref={canvasRef}
				width={BINARY_DIMENSION_X / RESIZE_FACTOR}
				height={DIMENSION_Y / RESIZE_FACTOR}
				style={{
					border: '1px solid black',
					transform: 'rotate(180deg) scaleX(-1)',
					margin: 'auto',
				}}
			/>
		</div>
	)
}

export default BinaryFileReader

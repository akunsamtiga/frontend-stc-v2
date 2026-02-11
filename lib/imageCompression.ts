// lib/imageCompression.ts - NO LIMITS VERSION
/**
 * ZERO VALIDATION IMAGE COMPRESSION
 * Accept ALL images without any restrictions!
 * Just compress to make it uploadable
 */

export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  targetSizeKB?: number
}

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  maxWidth: 2560,    // Very large limit
  maxHeight: 2560,   // Very large limit
  quality: 0.92,     // High quality
  targetSizeKB: 4500 // Just under 5MB backend limit
}

/**
 * Compress image - NO VALIDATION, just make it work!
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      console.warn('⚠️ FileReader error, returning original file')
      resolve(file) // Return original instead of reject
    }

    reader.onload = (e) => {
      const img = new Image()

      img.onerror = () => {
        console.warn('⚠️ Image load error, returning original file')
        resolve(file) // Return original instead of reject
      }

      img.onload = () => {
        try {
          let { width, height } = img
          const aspectRatio = width / height

          // Resize if too large (but very generous limits)
          if (opts.maxWidth && width > opts.maxWidth) {
            width = opts.maxWidth
            height = width / aspectRatio
          }

          if (opts.maxHeight && height > opts.maxHeight) {
            height = opts.maxHeight
            width = height * aspectRatio
          }

          const canvas = document.createElement('canvas')
          canvas.width = Math.round(width)
          canvas.height = Math.round(height)

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            console.warn('⚠️ Canvas error, returning original file')
            resolve(file)
            return
          }

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          // Use JPEG for everything (most compatible)
          const outputType = 'image/jpeg'

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn('⚠️ Blob creation failed, returning original file')
                resolve(file)
                return
              }

              // If compressed file is bigger, use original
              if (blob.size > file.size) {
                console.log('✅ Original file is smaller, using original')
                resolve(file)
                return
              }

              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.jpg'),
                { type: outputType }
              )

              console.log(`✅ Compressed:`, {
                original: `${(file.size / 1024).toFixed(0)}KB`,
                compressed: `${(compressedFile.size / 1024).toFixed(0)}KB`,
                dimensions: `${canvas.width}x${canvas.height}`
              })

              resolve(compressedFile)
            },
            outputType,
            opts.quality
          )
        } catch (error) {
          console.error('⚠️ Compression error:', error)
          resolve(file) // Return original on any error
        }
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

/**
 * NO VALIDATION - Accept everything!
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Accept EVERYTHING - no validation!
  return { valid: true }
}

/**
 * Get image dimensions (optional, non-blocking)
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onerror = () => reject(new Error('Cannot read file'))
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onerror = () => reject(new Error('Cannot load image'))
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      
      img.src = e.target?.result as string
    }
    
    reader.readAsDataURL(file)
  })
}
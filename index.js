/* global fxrand fxhash palettes preloadImagesTmr */

//
//  HEXAGONES - art for bots - revdancatt ??/??/2022
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

// Global values, because today I'm being an artist not an engineer!
// These are the generally common values we'll use across our projects
const ratio = 1 // canvas ratio
const features = {} // A global object to hold all the features we'll use in the draw stage
let nextFrame = null // requestAnimationFrame, and the ability to clear it
let resizeTmr = null // a timer to make sure we don't resize too often
let highRes = false // display high or low res
let thumbnailTaken = false // have we taken a thumbnail yet, so we don't take another
let forceDownloaded = false // are we forcing a download?
const urlSearchParams = new URLSearchParams(window.location.search)
const urlParams = Object.fromEntries(urlSearchParams.entries())
const prefix = 'Hexagones_Art_for_Bots'
// dumpOutputs will be set to false unless we have ?dumpOutputs=true in the URL
const dumpOutputs = urlParams.dumpOutputs === 'true'

// Global values, because today I'm being an artist not an engineer!
let lastTick = new Date().getTime() // keeping the animations the same rate no matter the fps
const startTime = new Date().getTime() // so we can figure out how long since the scene started
let timePassed = 0 // keeping track of the ms since our last frame
const speedMod = 1 // multiplier for the animation speed
const paused = true // are we paused

//  We need this to display features
window.$fxhashFeatures = {}

const makeFeatures = () => {
  //   Calculate the points we need to have a hexagon that fills the whole area
  const r = -0.5
  const startAngle = 30
  features.rootPoints = []
  for (let a = 0; a <= 5; a++) {
    //  Turn the x,y co-ords into the 6 x,y points we need to form a hexagon
    const x = (Math.sin((Math.PI / 180) * (a * 60 + startAngle)) * r)
    const y = (Math.cos((Math.PI / 180) * (a * 60 + startAngle)) * r)
    features.rootPoints.push({
      x,
      y
    })
  }
  features.rootPoints.push({
    x: 0,
    y: 0
  })

  //  Figure out a palette
  const palNumber = Math.floor(fxrand() * palettes.length)
  // const palNumber = 0
  features.palette = palettes[palNumber]

  //  Work out what mode we are
  features.mode = ['toggle'][Math.floor(fxrand() * 1)]
  const maxOsc = 7
  features.oscillators = (maxOsc - 3) - Math.floor(Math.sqrt(fxrand() * maxOsc * maxOsc)) + 5

  features.osc = []
  //  Now make the oscillators
  let oldColour = {
    h: null,
    s: null,
    l: null
  }
  for (let x = 0; x < features.oscillators; x++) {
    const newOsc = {
      min: fxrand() * 0.8 + 0.1,
      max: fxrand() * 0.8 + 0.1,
      speed: fxrand() * 0.9 + 0.1
    }
    newOsc.colour = features.palette[Math.floor(fxrand() * features.palette.length)]
    while (
      newOsc.colour.h === oldColour.h &&
      newOsc.colour.s === oldColour.s &&
      newOsc.colour.l === oldColour.l
    ) newOsc.colour = features.palette[Math.floor(fxrand() * features.palette.length)]
    oldColour = JSON.parse(JSON.stringify(newOsc.colour))
    features.osc.push(newOsc)
  }

  window.$fxhashFeatures.oscillators = features.oscillators
  window.$fxhashFeatures.palette = ['Frail Robin',
    'Basic Dragonfly',
    'Low Chill',
    'Corrupt Champion',
    'Formal Tiger',
    'Late Devil',
    'Eager Hurricane',
    'Late Liberty',
    'Sleeping Dragon',
    'Close Passenger',
    'First Supernova',
    'Proud Rose',
    'Stalking Biscuit',
    'Electric Clown',
    'Atomic Sunset',
    'Baked Luna'
  ][palNumber]
}
// Call makeFeatures() right away, because we want to do this as soon as possible
makeFeatures()
console.table(window.$fxhashFeatures)

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//
// Custom drawing code goes here. By this point everything that will be drawn
// has been decided, so we just need to draw it.
//
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const hexPoints = (points, scale) => {
  return JSON.parse(JSON.stringify(points)).map((point) => {
    // scale the points
    point.x *= scale
    point.y *= scale
    //  Now move them to the middle
    point.x += 0.5
    point.y += 0.5
    return point
  })
}

const clipZone = (ctx, width, height, points, zone) => {
  ctx.beginPath()
  if (zone === 0) {
    ctx.moveTo(points[6].x * width, points[6].y * height)
    ctx.lineTo(points[1].x * width, points[1].y * height)
    ctx.lineTo(points[0].x * width, points[0].y * height)
    ctx.lineTo(points[5].x * width, points[5].y * height)
  }
  if (zone === 1) {
    ctx.moveTo(points[6].x * width, points[6].y * height)
    ctx.lineTo(points[2].x * width, points[2].y * height)
    ctx.lineTo(points[1].x * width, points[1].y * height)
    ctx.lineTo(points[0].x * width, points[0].y * height)
  }
  if (zone === 2) {
    ctx.moveTo(points[6].x * width, points[6].y * height)
    ctx.lineTo(points[3].x * width, points[3].y * height)
    ctx.lineTo(points[2].x * width, points[2].y * height)
    ctx.lineTo(points[1].x * width, points[1].y * height)
  }
  if (zone === 3) {
    ctx.moveTo(points[6].x * width, points[6].y * height)
    ctx.lineTo(points[4].x * width, points[4].y * height)
    ctx.lineTo(points[3].x * width, points[3].y * height)
    ctx.lineTo(points[2].x * width, points[2].y * height)
  }
  if (zone === 4) {
    ctx.moveTo(points[6].x * width, points[6].y * height)
    ctx.lineTo(points[5].x * width, points[5].y * height)
    ctx.lineTo(points[4].x * width, points[4].y * height)
    ctx.lineTo(points[3].x * width, points[3].y * height)
  }
  if (zone === 5) {
    ctx.moveTo(points[6].x * width, points[6].y * height)
    ctx.lineTo(points[0].x * width, points[0].y * height)
    ctx.lineTo(points[5].x * width, points[5].y * height)
    ctx.lineTo(points[4].x * width, points[4].y * height)
  }
  ctx.clip()
}

const drawHex = (ctx, width, height, points, light, medium, dark) => {
  //  Draw the light face first
  ctx.fillStyle = light
  ctx.save()
  clipZone(ctx, width, height, points, 0)
  ctx.fillRect(0, 0, width, height)
  // drawHalftone(ctx, width, height, 50, 0.75, 0.25, 'hsla(120, 100%, 0%, 0.8)')
  // drawHalftone(ctx, width, height, 20, 1.5, 0.25, 'hsla(120, 100%, 100%, 0.8)')
  ctx.restore()

  //  Draw the medium face
  ctx.fillStyle = medium
  ctx.save()
  clipZone(ctx, width, height, points, 4)
  ctx.fillRect(0, 0, width, height)
  // drawHalftone(ctx, width, height, 50, 1, 0.5, 'hsla(120, 100%, 0%, 0.8)')
  ctx.restore()

  //  Draw the dark face
  ctx.fillStyle = dark
  ctx.save()
  clipZone(ctx, width, height, points, 2)
  ctx.fillRect(0, 0, width, height)
  // drawHalftone(ctx, width, height, 50, 1, 0.75, 'hsla(120, 100%, 0%, 0.8)')
  ctx.restore()
}

const drawInvertedHex = (ctx, width, height, points, light, medium, dark) => {
  //  Draw the light face first
  ctx.fillStyle = light
  ctx.save()
  clipZone(ctx, width, height, points, 3)
  ctx.fillRect(0, 0, width, height)
  // drawHalftone(ctx, width, height, 50, 1, 0.25, 'hsla(120, 100%, 0%, 0.8)')
  ctx.restore()

  //  Draw the medium face
  ctx.fillStyle = medium
  ctx.save()
  clipZone(ctx, width, height, points, 1)
  ctx.fillRect(0, 0, width, height)
  // drawHalftone(ctx, width, height, 50, 1, 0.5, 'hsla(120, 100%, 0%, 0.8)')
  ctx.restore()

  //  Draw the dark face
  ctx.fillStyle = dark
  ctx.save()
  clipZone(ctx, width, height, points, 5)
  ctx.fillRect(0, 0, width, height)
  // drawHalftone(ctx, width, height, 50, 1, 0.75, 'hsla(120, 100%, 0%, 0.8)')
  ctx.restore()
}

//  This is where we bring it all together
const drawCanvas = async () => {
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')

  const w = canvas.width
  const h = canvas.height

  //  update the time passed
  //  We do it this way so we can speed up time if needed.
  if (!paused) timePassed -= (new Date().getTime() - lastTick) * speedMod * (1 * (1 + Math.abs(Math.sin(timePassed / 100000))))
  lastTick = new Date().getTime()

  //  Fill the background
  const background = features.palette[features.palette.length - 1]
  ctx.fillStyle = `hsla(${background.h}, ${background.s}%, ${background.l}%, 1)`
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  //  Draw the main background hexagon
  const maxSize = 0.8
  const points = hexPoints(features.rootPoints, maxSize)
  const col = features.palette[0]
  let light = Math.floor(col.l + (100 - col.l) / 2)
  let medium = Math.floor(col.l)
  let dark = Math.floor(col.l / 2)
  light = Math.max(light, 10)
  light = Math.min(light, 90)
  medium = Math.max(medium, 10)
  medium = Math.min(medium, 90)
  dark = Math.max(dark, 10)
  dark = Math.min(dark, 90)
  drawHex(ctx, w, h, points,
    `hsla(${col.h}, ${col.s}%, ${light}%, 1)`,
    `hsla(${col.h}, ${col.s}%, ${medium}%, 1)`,
    `hsla(${col.h}, ${col.s}%, ${dark}%, 1)`
  )

  //  Work out where we are between the two points
  const diff = startTime - new Date().getTime()
  features.osc.forEach((osc) => {
    // console.log(osc.min + ' : ' + osc.max)
    osc.mid = osc.min + ((osc.max - osc.min) * Math.abs(Math.sin((diff) / 2500 * osc.speed)))
  })

  features.osc = features.osc.sort((a, b) => (a.min < b.min) ? 1 : -1)
  let toggle = false
  if (features.mode === 'toggle') toggle = true
  //  Now draw the rest of the oscillators
  features.osc.forEach((osc) => {
    const mod = osc.mid
    const points = hexPoints(features.rootPoints, mod * maxSize)
    const col = osc.colour
    let light = Math.floor(col.l + (100 - col.l) / 2)
    let medium = Math.floor(col.l)
    let dark = Math.floor(col.l / 2)
    light = Math.max(light, 10)
    light = Math.min(light, 90)
    medium = Math.max(medium, 10)
    medium = Math.min(medium, 90)
    dark = Math.max(dark, 10)
    dark = Math.min(dark, 90)
    if (toggle) {
      drawInvertedHex(ctx, w, h, points,
        `hsla(${col.h}, ${col.s}%, ${light}%, 1)`,
        `hsla(${col.h}, ${col.s}%, ${medium}%, 1)`,
        `hsla(${col.h}, ${col.s}%, ${dark}%, 1)`
      )
    } else {
      drawHex(ctx, w, h, points,
        `hsla(${col.h}, ${col.s}%, ${light}%, 1)`,
        `hsla(${col.h}, ${col.s}%, ${medium}%, 1)`,
        `hsla(${col.h}, ${col.s}%, ${dark}%, 1)`
      )
    }
    if (features.mode === 'toggle') toggle = !toggle
  })

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Below is code that is common to all the projects, there may be some
  // customisation for animated work or special cases

  // Try various methods to tell the parent window that we've drawn something
  if (!thumbnailTaken) {
    try {
      $fx.preview()
    } catch (e) {
      try {
        fxpreview()
      } catch (e) {
      }
    }
    thumbnailTaken = true
  }

  // If we are forcing download, then do that now
  if (dumpOutputs || ('forceDownload' in urlParams && forceDownloaded === false)) {
    forceDownloaded = 'forceDownload' in urlParams
    await autoDownloadCanvas()
    // Tell the parent window that we have downloaded
    window.parent.postMessage('forceDownloaded', '*')
  } else {
    //  We should wait for the next animation frame here
    nextFrame = window.requestAnimationFrame(drawCanvas)
  }
  //
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//
// These are the common functions that are used by the canvas that we use
// across all the projects, init sets up the resize event and kicks off the
// layoutCanvas function.
//
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

//  Call this to start everything off
const init = async () => {
  // Resize the canvas when the window resizes, but only after 100ms of no resizing
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(async () => {
      await layoutCanvas()
    }, 100)
  })

  //  Now layout the canvas
  await layoutCanvas()
}

/*
  This function will set up the canvas to be the correct size and then place it onto the page.
  It gets called whenever the canvas is resized. The end of this function then calls the
  drawCanvas function. We should never call the drawCanvas function directly.
*/
const layoutCanvas = async (windowObj = window, urlParamsObj = urlParams) => {
  //  Kill the next animation frame (note, this isn't always used, only if we're animating)
  windowObj.cancelAnimationFrame(nextFrame)

  //  Get the window size, and devicePixelRatio
  const { innerWidth: wWidth, innerHeight: wHeight, devicePixelRatio = 1 } = windowObj
  let dpr = devicePixelRatio
  let cWidth = wWidth
  let cHeight = cWidth * ratio

  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }

  // Grab any canvas elements so we can delete them
  const canvases = document.getElementsByTagName('canvas')
  Array.from(canvases).forEach(canvas => canvas.remove())

  // Now set the target width and height
  let targetHeight = highRes ? 4096 : cHeight
  let targetWidth = targetHeight / ratio

  //  If the alba params are forcing the width, then use that (only relevant for Alba)
  if (windowObj.alba?.params?.width) {
    targetWidth = window.alba.params.width
    targetHeight = Math.floor(targetWidth * ratio)
  }

  // If *I* am forcing the width, then use that, and set the dpr to 1
  // (as we want to render at the exact size)
  if ('forceWidth' in urlParams) {
    targetWidth = parseInt(urlParams.forceWidth)
    targetHeight = Math.floor(targetWidth * ratio)
    dpr = 1
  }

  // Update based on the dpr
  targetWidth *= dpr
  targetHeight *= dpr

  //  Set the canvas width and height
  const canvas = document.createElement('canvas')
  canvas.id = 'target'
  canvas.width = targetWidth
  canvas.height = targetHeight
  document.body.appendChild(canvas)

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Custom code (for defining textures and buffer canvas goes here) if needed
  //

  // ...

  //
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  //  And draw it!!
  drawCanvas()
}

//  This allows us to download the canvas as a PNG
// If we are forcing the id then we add that to the filename
const autoDownloadCanvas = async () => {
  const canvas = document.getElementById('target')

  // Create a download link
  const element = document.createElement('a')
  const filename = 'forceId' in urlParams
    ? `${prefix}_${urlParams.forceId.toString().padStart(4, '0')}_${fxhash}`
    : `${prefix}_${fxhash}`
  element.setAttribute('download', filename)

  // Hide the link element
  element.style.display = 'none'
  document.body.appendChild(element)

  // Convert canvas to Blob and set it as the link's href
  const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob))

  // Trigger the download
  element.click()

  // Clean up by removing the link element
  document.body.removeChild(element)

  // Reload the page if dumpOutputs is true
  if (dumpOutputs) {
    window.location.reload()
  }
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event

  // == Common controls ==
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log('Highres mode is now', highRes)
    await layoutCanvas()
  }
})

//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  If paper1 has loaded and we haven't draw anything yet, then kick it all off
  if (!thumbnailTaken) {
    clearInterval(preloadImagesTmr)
    init()
  }
}

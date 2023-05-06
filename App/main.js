// Welcome to main.js, where we set up the SineRider engine basics

const stepping = false

function removeAllUi() {
  document.getElementById('top-bar').remove();
  document.getElementById('lvl-debug-info').remove();
  document.getElementById('controls-bar').remove();
  document.getElementById('dotted-math-container').remove();
  document.getElementById('victory-bar').remove();
}

// Core constants

const ui = {
  menuBar: $('#menu-bar'),
  editButton: $('#edit-button'),
  levelText: $('#level-text'),
  levelButton: $('#level-button'),
  levelButtonString: $('#level-button > .string'),
  resetButton: $('#reset-button'),

  resetConfirmationDialog: $('#reset-confirmation-dialog'),
  resetConfirmButton: $('#reset-confirmation-yes'),
  resetCancelButton: $('#reset-confirmation-no'),

  tryAgainButton: $('#try-again-button'),

  veil: $('#veil'),
  loadingVeil: $('#loading-veil'),
  loadingVeilString: $('#loading-string'),
  loadingProgressBarContainer: $('#loading-progress-bar-container'),
  loadingProgressBar: $('#loading-progress-bar'),
  twitterLinkRedirect: $('#twitter-link'),
  redditLinkRedirect: $('#reddit-link'),
  githubLinkRedirect: $('#github-link'),

  bubblets: $('.bubblets'),

  topBar: $('#top-bar'),
  navigatorButton: $('#navigator-button'),

  victoryBar: $('#victory-bar'),
  victoryLabel: $('#victory-label'),
  victoryLabelString: $('#victory-label > .string'),
  timeTaken: $('#time-taken'),
  charCount: $('#character-count'),
  nextButton: $('#next-button'),
  nextButtonText: $('#next-button-text'),

  messageBar: $('#message-bar'),
  messageBarString: $('#message-bar > .string'),

  tSliderContainer: $('#t-variable-container'),
  tSlider: $('#t-variable-slider'),

  variablesBar: $('#variables-bar'),
  timeString: $('#time-string'),
  completionTime: $('#completion-time'),

  submitTwitterScoreDiv: $('#submit-twitter-score-div'),
  submitTwitterScoreLink: $('#submit-twitter-score-link'),
  submitRedditScoreDiv: $('#submit-reddit-score-div'),
  submitRedditScoreLink: $('#submit-reddit-score-link'),
  submitRedditScoreSubreddit: $('#submit_reddit_score_subreddit'),

  redditOpenModal: $('#reddit-open-bar'),
  redditOpenCommand: $('#reddit-open-command'),
  redditOpenCloseButton: $('#close-reddit-open-button'),

  controlBar: $('#controls-bar'),
  expressionText: $('#expression-text'),
  expressionEnvelope: $('#expression-envelope'),

  mathFieldLabel: $('#variable-label > .string'),
  _mathField: $('#math-field'),
  mathField: $('#math-field'),
  mathFieldStatic: $('#math-field-static'),

  dottedMathContainer: $('#dotted-math-container'),
  dottedMathFieldStatic: $('#dotted-math-field-static'),
  dottedMathField: $('#dotted-math-field-static'),
  dottedSlider: $('#dotted-slider'),
  dottedHintButton: $('#dotted-math-button'),

  volumeSlider: $('#volume-slider'),

  variableLabel: $('#variable-label'),

  runButton: $('#run-button'),
  runButtonString: $('#run-button > .string'),
  stopButton: $('#stop-button'),
  stopButtonString: $('#stop-button > .string'),

  navigatorFloatingBar: $('#navigator-floating-bar'),

  showAllButton: $('#show-all-button'),

  showAllConfirmationDialog: $('#show-all-confirmation-dialog'),
  showAllConfirmButton: $('#show-all-yes'),
  showAllCancelButton: $('#show-all-no'),

  editorInspector: {
    editorInspector: $('#editor-inspector'),
    order: $('#editor-order-input'),
    timer: $('#editor-timer-input'),
    x: $('#editor-x-input'),
    y: $('#editor-y-input'),
    deleteSelection: $('#editor-inspector-delete'),
  },

  editorSpawner: {
    editorSpawner: $('#editor-spawner'),
    addFixed: $('#editor-spawner-fixed'),
    addDynamic: $('#editor-spawner-dynamic'),
    addPath: $('#editor-spawner-path'),
  },
  levelInfoDiv: $('#lvl-debug-info'),
  levelInfoNameStr: $('#lvl-name-str'),
  levelInfoNickStr: $('#lvl-nick-str'),
  levelInfoFpsStr: $('#lvl-fps-str'),
  hideLevelInfoButton: $('#button-hide-level-info'),
}

const editor = Editor(ui)

ui.levelText.setAttribute('hide', true)
ui.veil.setAttribute('hide', true)

const canvas = $('#canvas')

let canvasIsDirty = true

const urlParams = new URLSearchParams(window.location.search)

const ticksPerSecondOverridden = urlParams.has('ticksPerSecond')

// 60 ticks per second default, but overridable via query param
const ticksPerSecond = ticksPerSecondOverridden
  ? urlParams.get('ticksPerSecond')
  : 60

// This is deliberately decoupled from 'ticksPerSecond' such that we can keep consistent
// predictable results while replaying the game simulation at higher-than-realtime speeds.
const tickDelta = 1.0 / 60.0

const startTime = Date.now()

// A positive integer that modifies how much the game draws.  A setting of 1 would result
// in all frames rendered, 2 would draw every other, etc...
const drawModulo = urlParams.has('drawModulo') ? urlParams.get('drawModulo') : 1

const screen = Screen({
  canvas,
})

let w = worldData[0]

// const DEBUG_LEVEL = 'Level Editor'
// const DEBUG_LEVEL = 'Volcano'
// const DEBUG_LEVEL = 'Constant Lake'
// const DEBUG_LEVEL = 'Two Below'
// const DEBUG_LEVEL = 'Time Hard'
const DEBUG_LEVEL = null

if (DEBUG_LEVEL) {
  // make debug level first level for testing
  const debugLevelIndex = w.levelData.findIndex((l) => l.name === DEBUG_LEVEL)
  if (debugLevelIndex == -1)
    alert(`DEBUG: Unable to find level '${DEBUG_LEVEL}'`)
  const tmp = w.levelData[0]
  w.levelData[0] = w.levelData[debugLevelIndex]
  w.levelData[debugLevelIndex] = tmp
}

// Don't show debug info in production
if (window.location.hostname === 'sinerider.com')
  ui.levelInfoDiv.setAttribute('hide', true)

const world = World({
  ui,
  screen,
  requestDraw,
  tickDelta,
  drawOrder: NINF,
  ...worldData[0],
})

var numTicks = 0

// Core methods
function tick() {
  tickInternal()

  // setTimeout imposes a minimum overhead as the delay approaches 0, and thus it becomes very likely
  // that our timer loop will fall behind our desired tick rate at ticks/sec > 250
  // we will check that here and tick repeatedly until we catch up
  if (ticksPerSecond >= 250) {
    const elapsedMs = Date.now() - startTime
    const expectedTicks = (elapsedMs / 1000.0) * ticksPerSecond
    while (numTicks < expectedTicks) {
      tickInternal()
    }
  }
}

function tickInternal() {
  numTicks++
  world.awake()
  world.start()

  world.sendEvent('tick')

  if (numTicks % drawModulo == 0) {
    requestDraw()
  }
}

let timeOfLastDraw = null
let currentFps = 60

function draw() {
  if (!canvasIsDirty) return
  canvasIsDirty = false

  // Draw order bug where Shader entity isn't actually
  // sorted in World draw array and needs another sort call
  // in order to work? Temp fix (TODO: Fix this)
  // world.sortDrawArray()

  let entity
  for (let i = 0; i < world.drawArray.length; i++) {
    entity = world.drawArray[i]

    if (entity.activeInHierarchy && entity.draw) {
      screen.ctx.save()
      if (entity.predraw) entity.predraw()
      entity.draw()
      screen.ctx.restore()
    }
  }

  let now = performance.now()
  if (timeOfLastDraw) {
    let frameFps = 1000 / (now - timeOfLastDraw)
    currentFps = 0.9 * currentFps + 0.1 * frameFps
    ui.levelInfoFpsStr.innerText = 'FPS: ' + currentFps.toFixed(2)
  }
  timeOfLastDraw = now
}

function requestDraw() {
  if (!canvasIsDirty) {
    canvasIsDirty = true
    requestAnimationFrame(draw)
  }
}

tick()
draw()

if (!stepping) {
  setInterval(tick, 1000 / ticksPerSecond)
}

// T Parameter Slider
ui.tSlider.addEventListener('input', refreshTSlider)
function refreshTSlider() {
  if (world.globalScope && !world.running) {
    const newT = math.remap(0, 100, 0, 10, Number(ui.tSlider.value))

    world.level?.sendEvent('tVariableChanged', [newT])
  }
}

// MathQuill

ui.mathFieldStatic = MQ.StaticMath(ui.mathFieldStatic)

function createMathField(field, eventNameOnEdit) {
  field = MQ.MathField(field, {
    handlers: {
      edit: function () {
        const text = field.getPlainExpression()
        const latex = field.latex()
        world.level.sendEvent(eventNameOnEdit, [text, latex])
      },
    },
  })

  field.getPlainExpression = function () {
    var tex = field.latex()
    return mathquillToMathJS(tex)
  }

  return field
}

ui.mathField = createMathField(ui.mathField, 'setGraphExpression')
ui.mathField.focused = () => ui._mathField.classList.contains('mq-focused')

ui.dottedMathFieldStatic = MQ.StaticMath(ui.dottedMathFieldStatic)

function onMathFieldFocus(event) {
  world.onMathFieldFocus()
}

function onGridlinesDeactive(event) {
  world.onGridlinesDeactive()
}
function onGridlinesActive(event) {
  world.onGridlinesActive()
}

function onCoordinate(x, y) {
  world.onCoordinate(x, y)
}

ui.expressionEnvelope.addEventListener('focusin', onMathFieldFocus)

function onMathFieldBlur(event) {
  world.onMathFieldBlur()
}

ui.expressionEnvelope.addEventListener('blurout', onMathFieldBlur)

// HTML events

function onKeyUp(event) {
  if (event.keyCode === 13) {
    if (!world.navigating && !world.level?.isRunningAsCutscene)
      world.toggleRunning()
  }
  world.sendEvent('keyup', [event.key])
}

window.addEventListener('keydown', (event) => {
  if (ui.mathField.focused()) return
  // world.level?.sendEvent('keydown', [event.key])
  world.sendEvent('keydown', [event.key])
})

window.addEventListener('keyup', onKeyUp)

function onExpressionTextChanged(event) {
  world.level.sendEvent('setGraphExpression', [ui.expressionText.value])
}

function setGlobalVolumeLevel(i) {
  Howler.volume(i)
  window.localStorage.setItem('volume', i)
}

function onSetVolume(event) {
  let volume = event.target.value / 100
  setGlobalVolumeLevel(volume)
}

ui.volumeSlider.addEventListener('change', onSetVolume)
ui.volumeSlider.addEventListener('mouseup', onSetVolume)
ui.volumeSlider.addEventListener('input', onSetVolume)

function onClickHint() {
  ui.dottedHintButton.style.display = 'none'

  ui.dottedSlider.hidden = false
  ui.dottedSlider.style.innerHeight = '200px'
  ui.dottedMathField.style.display = 'block'

  world.level.sendEvent('displayDottedGraph')
}

ui.dottedHintButton.addEventListener('click', onClickHint)

// prevent twitter link click from triggering level click
ui.twitterLinkRedirect.addEventListener('click', function (event) {
  event.stopPropagation()
})

// prevent reddit link click from triggering level click
ui.redditLinkRedirect.addEventListener('click', function (event) {
  event.stopPropagation()
})

// prevent github link click from triggering level click
ui.githubLinkRedirect.addEventListener('click', function (event) {
  event.stopPropagation()
})

// Initial page state
{
  let volume = window.localStorage.getItem('volume')
  if (volume) {
    setGlobalVolumeLevel(window.localStorage)
    ui.volumeSlider.value = volume * 100
  }
}
setGlobalVolumeLevel(ui.volumeSlider.value / 100)

function onClickMapButton(event) {
  world.onClickMapButton()
  requestDraw()
}

ui.levelButton.addEventListener('click', onClickMapButton)
ui.navigatorButton.addEventListener('click', onClickMapButton)

function onClickNextButton(event) {
  world.onClickNextButton()
}

ui.nextButton.addEventListener('click', onClickNextButton)

function onClickRunButton(event) {
  if (!world.level?.isRunningAsCutscene && !world.navigating)
    world.toggleRunning()

  return true
}

// TODO: Encapsulate run/stop/victory button behavior (Entity?)
ui.runButton.addEventListener('click', onClickRunButton)
ui.stopButton.addEventListener('click', onClickRunButton)
ui.tryAgainButton.addEventListener('click', onClickRunButton)

function onClickShowAllButton(event) {
  let showall = localStorage.getItem('ShowAll')
  if (showall != 'True') {
    ui.showAllConfirmationDialog.showModal()
  } else {
    onShowAllConfirm()
  }
}

ui.showAllButton.addEventListener('click', onClickShowAllButton)

function onClickEditButton(event) {
  world.editing = !world.editing
}

ui.editButton.addEventListener('click', onClickEditButton)

function onClickResetButton(event) {
  ui.resetConfirmationDialog.showModal()
}

ui.resetButton.addEventListener('click', onClickResetButton)

function onResetConfirm() {
  world.onResetConfirm()
  ui.resetConfirmationDialog.close()
}

ui.resetConfirmButton.addEventListener('click', onResetConfirm)

function onResetCancel() {
  ui.resetConfirmationDialog.close()
}

ui.resetCancelButton.addEventListener('click', onResetCancel)

function onShowAllConfirm() {
  world.navigator.showAll = !world.navigator.showAll
  ui.showAllConfirmationDialog.close()
  window.localStorage.setItem('ShowAll', 'True')
}

ui.showAllConfirmButton.addEventListener('click', onShowAllConfirm)

function onShowAllCancel() {
  ui.showAllConfirmationDialog.close()
}

ui.showAllCancelButton.addEventListener('click', onShowAllCancel)

function onResizeWindow(event) {
  world.sendEvent('resize', [window.innerWidth, window.innerHeight])
  screen.resize()
  canvasIsDirty = true
  draw()
}

window.addEventListener('resize', onResizeWindow)

function onClickCanvas() {
  if (stepping) {
    tick()
  }
}

canvas.addEventListener('click', onClickCanvas)
ui.veil.addEventListener('click', onClickCanvas)

function onMouseMoveCanvas(event) {
  world.clickableContext.processEvent(event, 'mouseMove')
  event.preventDefault()
}

function onMouseMoveWindow(event) {
  onCoordinate(event.clientX, event.clientY)
}

canvas.addEventListener('mousemove', onMouseMoveCanvas)
canvas.addEventListener('pointermove', onMouseMoveCanvas)

window.addEventListener('mousemove', onMouseMoveWindow)
window.addEventListener('pointermove', onMouseMoveWindow)

function onMouseDownCanvas(event) {
  world.clickableContext.processEvent(event, 'mouseDown')
  event.preventDefault()
  onGridlinesActive()
  onCoordinate(event.clientX, event.clientY)
  ui.mathField.blur()
}

canvas.addEventListener('mousedown', onMouseDownCanvas)
canvas.addEventListener('pointerdown', onMouseDownCanvas)

function onMouseUpCanvas(event) {
  ui.tSlider.value = 0
  refreshTSlider()
  world.clickableContext.processEvent(event, 'mouseUp')
  event.preventDefault()
  onGridlinesDeactive()
}

canvas.addEventListener('mouseup', onMouseUpCanvas)
window.addEventListener('pointerup', onMouseUpCanvas)

ui.levelInfoDiv.addEventListener('mouseover', function () {
  console.log('mouseover')
  ui.hideLevelInfoButton.setAttribute('hide', false)
})

ui.levelInfoDiv.addEventListener('mouseleave', function () {
  console.log('mouseleave')
  ui.hideLevelInfoButton.setAttribute('hide', true)
})

import { Game } from './Game.js'
import { clamp } from 'three/src/math/MathUtils.js'
import { remapClamp } from './utilities/maths.js'
import gsap from 'gsap'

export class HUD
{
    constructor()
    {
        this.game = Game.getInstance()

        this.visible = true
        this.elements = {}

        this.setDOM()
        this.setSpeedometer()
        this.setBoostMeter()
        this.setAltitude()
        this.setCompass()
        this.setDriftScore()
        this.setNotificationBadge()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 11)

        // Toggle HUD visibility
        this.game.inputs.addActions([
            { name: 'hudToggle', categories: [ 'wandering', 'racing' ], keys: [ 'Keyboard.KeyU' ] }
        ])

        this.game.inputs.events.on('hudToggle', (action) =>
        {
            if(action.active)
                this.toggle()
        })
    }

    setDOM()
    {
        // Main HUD container
        this.elements.container = document.querySelector('.js-hud')

        if(!this.elements.container)
        {
            this.elements.container = document.createElement('div')
            this.elements.container.classList.add('js-hud', 'hud')
            this.game.domElement.appendChild(this.elements.container)
        }
    }

    setSpeedometer()
    {
        this.speedometer = {}
        this.speedometer.value = 0
        this.speedometer.smoothedValue = 0
        this.speedometer.maxSpeed = 120 // km/h display max

        // Create speedometer element
        const el = document.createElement('div')
        el.classList.add('hud-speedometer')
        el.innerHTML = `
            <svg class="hud-speedo-ring" viewBox="0 0 120 120">
                <circle class="hud-speedo-track" cx="60" cy="60" r="52" />
                <circle class="js-speedo-fill hud-speedo-fill" cx="60" cy="60" r="52" />
            </svg>
            <div class="hud-speedo-inner">
                <span class="js-speedo-value hud-speedo-value">0</span>
                <span class="hud-speedo-unit">KM/H</span>
            </div>
        `
        this.elements.container.appendChild(el)

        this.speedometer.valueElement = el.querySelector('.js-speedo-value')
        this.speedometer.fillElement = el.querySelector('.js-speedo-fill')

        // SVG circle setup
        const radius = 52
        this.speedometer.circumference = 2 * Math.PI * radius
        this.speedometer.fillElement.style.strokeDasharray = this.speedometer.circumference
        this.speedometer.fillElement.style.strokeDashoffset = this.speedometer.circumference
    }

    setBoostMeter()
    {
        this.boostMeter = {}
        this.boostMeter.value = 0
        this.boostMeter.smoothedValue = 0
        this.boostMeter.fuel = 1 // 0 to 1
        this.boostMeter.rechargeRate = 0.15
        this.boostMeter.drainRate = 0.4
        this.boostMeter.cooldownActive = false

        const el = document.createElement('div')
        el.classList.add('hud-boost')
        el.innerHTML = `
            <div class="hud-boost-label">NITRO</div>
            <div class="hud-boost-bar">
                <div class="js-boost-fill hud-boost-fill"></div>
                <div class="js-boost-glow hud-boost-glow"></div>
            </div>
        `
        this.elements.container.appendChild(el)

        this.boostMeter.fillElement = el.querySelector('.js-boost-fill')
        this.boostMeter.glowElement = el.querySelector('.js-boost-glow')
        this.boostMeter.containerElement = el
    }

    setAltitude()
    {
        this.altitude = {}
        this.altitude.value = 0

        const el = document.createElement('div')
        el.classList.add('hud-altitude')
        el.innerHTML = `
            <span class="hud-altitude-icon">▲</span>
            <span class="js-altitude-value hud-altitude-value">0.0</span>
            <span class="hud-altitude-unit">m</span>
        `
        this.elements.container.appendChild(el)

        this.altitude.valueElement = el.querySelector('.js-altitude-value')
    }

    setCompass()
    {
        this.compass = {}
        this.compass.angle = 0

        const el = document.createElement('div')
        el.classList.add('hud-compass')
        el.innerHTML = `
            <div class="hud-compass-marker">▼</div>
            <div class="js-compass-strip hud-compass-strip">
                <span data-dir="N">N</span>
                <span data-dir="">·</span>
                <span data-dir="NE">NE</span>
                <span data-dir="">·</span>
                <span data-dir="E">E</span>
                <span data-dir="">·</span>
                <span data-dir="SE">SE</span>
                <span data-dir="">·</span>
                <span data-dir="S">S</span>
                <span data-dir="">·</span>
                <span data-dir="SW">SW</span>
                <span data-dir="">·</span>
                <span data-dir="W">W</span>
                <span data-dir="">·</span>
                <span data-dir="NW">NW</span>
                <span data-dir="">·</span>
            </div>
        `
        this.elements.container.appendChild(el)

        this.compass.stripElement = el.querySelector('.js-compass-strip')
    }

    setDriftScore()
    {
        this.driftScore = {}
        this.driftScore.active = false
        this.driftScore.value = 0
        this.driftScore.multiplier = 1
        this.driftScore.totalScore = 0
        this.driftScore.driftDuration = 0
        this.driftScore.minAngle = 0.25 // Minimum drift angle (radians)
        this.driftScore.minSpeed = 3

        const el = document.createElement('div')
        el.classList.add('hud-drift', 'is-hidden')
        el.innerHTML = `
            <div class="hud-drift-label">DRIFT</div>
            <div class="js-drift-score hud-drift-score">0</div>
            <div class="js-drift-multiplier hud-drift-multiplier">x1</div>
        `
        this.elements.container.appendChild(el)

        this.driftScore.element = el
        this.driftScore.scoreElement = el.querySelector('.js-drift-score')
        this.driftScore.multiplierElement = el.querySelector('.js-drift-multiplier')
    }

    setNotificationBadge()
    {
        this.notificationBadge = {}

        const el = document.createElement('div')
        el.classList.add('hud-tip', 'is-hidden')
        el.innerHTML = `
            <span class="hud-tip-text">Press <kbd>U</kbd> to toggle HUD</span>
        `
        this.elements.container.appendChild(el)
        this.notificationBadge.element = el

        // Show tip briefly
        setTimeout(() =>
        {
            el.classList.remove('is-hidden')
            setTimeout(() =>
            {
                el.classList.add('is-hidden')
            }, 5000)
        }, 8000)
    }

    toggle()
    {
        this.visible = !this.visible
        this.elements.container.classList.toggle('is-hidden', !this.visible)
    }

    update()
    {
        if(!this.visible)
            return

        const delta = this.game.ticker.deltaScaled
        const physicalVehicle = this.game.physicalVehicle

        // --- Speedometer ---
        const speedKmh = physicalVehicle.xzSpeed * 3.6 // m/s to km/h approximation
        this.speedometer.smoothedValue += (speedKmh - this.speedometer.smoothedValue) * delta * 8
        const displaySpeed = Math.round(Math.max(0, this.speedometer.smoothedValue))
        this.speedometer.valueElement.textContent = displaySpeed

        // Update SVG ring
        const speedRatio = clamp(displaySpeed / this.speedometer.maxSpeed, 0, 1)
        const offset = this.speedometer.circumference * (1 - speedRatio * 0.75) // 270 degree arc
        this.speedometer.fillElement.style.strokeDashoffset = offset

        // Color based on speed
        if(speedRatio > 0.8)
            this.speedometer.fillElement.style.stroke = '#ff3b3b'
        else if(speedRatio > 0.5)
            this.speedometer.fillElement.style.stroke = '#ffaa00'
        else
            this.speedometer.fillElement.style.stroke = '#00e5ff'

        // --- Boost Meter ---
        const isBoosting = this.game.player.boosting > 0 && Math.abs(this.game.player.accelerating) > 0

        if(isBoosting && this.boostMeter.fuel > 0)
        {
            this.boostMeter.fuel -= this.boostMeter.drainRate * delta
            this.boostMeter.fuel = Math.max(0, this.boostMeter.fuel)
            this.boostMeter.containerElement.classList.add('is-active')
        }
        else
        {
            this.boostMeter.fuel += this.boostMeter.rechargeRate * delta
            this.boostMeter.fuel = Math.min(1, this.boostMeter.fuel)
            this.boostMeter.containerElement.classList.remove('is-active')

            if(this.boostMeter.fuel <= 0)
                this.boostMeter.cooldownActive = true
            if(this.boostMeter.fuel >= 0.3)
                this.boostMeter.cooldownActive = false
        }

        this.boostMeter.fillElement.style.transform = `scaleX(${this.boostMeter.fuel})`

        if(this.boostMeter.fuel < 0.2)
            this.boostMeter.fillElement.style.background = 'linear-gradient(90deg, #ff3b3b, #ff6b3b)'
        else if(isBoosting)
            this.boostMeter.fillElement.style.background = 'linear-gradient(90deg, #ff6b00, #ffaa00)'
        else
            this.boostMeter.fillElement.style.background = 'linear-gradient(90deg, #00e5ff, #00ff88)'

        // --- Altitude ---
        const alt = Math.max(0, physicalVehicle.position.y - 0.5).toFixed(1)
        this.altitude.valueElement.textContent = alt

        // --- Compass ---
        const angle = Math.atan2(physicalVehicle.forward.z, physicalVehicle.forward.x)
        const degrees = ((angle * 180 / Math.PI) + 360) % 360
        const translateX = -(degrees / 360) * 100
        this.compass.stripElement.style.transform = `translateX(${translateX}%)`

        // --- Drift Score ---
        if(physicalVehicle.xzSpeed > this.driftScore.minSpeed)
        {
            const forwardRatio = Math.abs(physicalVehicle.forwardRatio)
            const driftAngle = 1 - forwardRatio

            if(driftAngle > this.driftScore.minAngle)
            {
                if(!this.driftScore.active)
                {
                    this.driftScore.active = true
                    this.driftScore.value = 0
                    this.driftScore.multiplier = 1
                    this.driftScore.driftDuration = 0
                    this.driftScore.element.classList.remove('is-hidden')
                }

                this.driftScore.driftDuration += delta
                const scoreIncrement = Math.round(driftAngle * physicalVehicle.xzSpeed * 10 * delta)
                this.driftScore.value += scoreIncrement

                // Multiplier increases over time
                this.driftScore.multiplier = Math.min(5, 1 + Math.floor(this.driftScore.driftDuration / 2))

                this.driftScore.scoreElement.textContent = Math.round(this.driftScore.value * this.driftScore.multiplier)
                this.driftScore.multiplierElement.textContent = `x${this.driftScore.multiplier}`

                // Achievement: drift for 5 seconds
                if(this.driftScore.driftDuration >= 5)
                    this.game.achievements.setProgress('drifter', 1)
            }
            else if(this.driftScore.active)
            {
                this.endDrift()
            }
        }
        else if(this.driftScore.active)
        {
            this.endDrift()
        }
    }

    endDrift()
    {
        if(!this.driftScore.active)
            return

        this.driftScore.active = false
        const finalScore = Math.round(this.driftScore.value * this.driftScore.multiplier)
        this.driftScore.totalScore += finalScore

        // Fade out
        gsap.to(this.driftScore.element, {
            opacity: 0,
            y: -20,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () =>
            {
                this.driftScore.element.classList.add('is-hidden')
                this.driftScore.element.style.opacity = ''
                this.driftScore.element.style.transform = ''
            }
        })
    }
}

import { Game } from './Game.js'
import gsap from 'gsap'

export class PauseScreen
{
    constructor()
    {
        this.game = Game.getInstance()

        this.isPaused = false
        this.setDOM()
        this.setInputs()
    }

    setDOM()
    {
        this.element = document.querySelector('.js-pause-screen')

        if(!this.element)
        {
            this.element = document.createElement('div')
            this.element.classList.add('js-pause-screen', 'pause-screen', 'is-hidden')
            this.element.innerHTML = `
                <div class="pause-overlay"></div>
                <div class="pause-content">
                    <div class="pause-title">PAUSED</div>
                    <div class="pause-menu">
                        <button class="js-pause-resume pause-btn pause-btn-primary">
                            <span class="pause-btn-icon">▶</span>
                            <span>Resume</span>
                        </button>
                        <button class="js-pause-respawn pause-btn">
                            <span class="pause-btn-icon">↻</span>
                            <span>Respawn</span>
                        </button>
                        <button class="js-pause-reset pause-btn">
                            <span class="pause-btn-icon">⟲</span>
                            <span>Reset World</span>
                        </button>
                        <button class="js-pause-audio pause-btn">
                            <span class="pause-btn-icon">♫</span>
                            <span class="js-audio-label">Mute Audio</span>
                        </button>
                        <button class="js-pause-quality pause-btn">
                            <span class="pause-btn-icon">⚙</span>
                            <span class="js-quality-label">Quality: High</span>
                        </button>
                    </div>
                    <div class="pause-footer">
                        <span class="pause-hint">Press <kbd>ESC</kbd> or <kbd>P</kbd> to resume</span>
                    </div>
                </div>
            `
            this.game.domElement.appendChild(this.element)
        }

        // Button bindings
        this.element.querySelector('.js-pause-resume').addEventListener('click', () => this.resume())
        this.element.querySelector('.js-pause-respawn').addEventListener('click', () =>
        {
            this.resume()
            this.game.player.respawn()
        })
        this.element.querySelector('.js-pause-reset').addEventListener('click', () =>
        {
            this.resume()
            this.game.reset()
        })
        this.element.querySelector('.js-pause-audio').addEventListener('click', () =>
        {
            this.game.audio.toggle()
            this.updateAudioLabel()
        })
        this.element.querySelector('.js-pause-quality').addEventListener('click', () =>
        {
            this.game.quality.toggle()
            this.updateQualityLabel()
        })
    }

    setInputs()
    {
        this.game.inputs.addActions([
            { name: 'pause', categories: [ 'wandering', 'racing', 'cinematic', 'intro' ], keys: [ 'Keyboard.Escape', 'Keyboard.KeyP', 'Gamepad.start' ] }
        ])

        this.game.inputs.events.on('pause', (action) =>
        {
            if(action.active)
            {
                if(this.isPaused)
                    this.resume()
                else
                    this.pause()
            }
        })
    }

    pause()
    {
        if(this.isPaused)
            return

        this.isPaused = true
        this.element.classList.remove('is-hidden')
        this.updateAudioLabel()
        this.updateQualityLabel()

        gsap.fromTo(this.element.querySelector('.pause-content'),
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.7)' }
        )
    }

    resume()
    {
        if(!this.isPaused)
            return

        this.isPaused = false

        gsap.to(this.element.querySelector('.pause-content'),
        {
            opacity: 0,
            scale: 0.9,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () =>
            {
                this.element.classList.add('is-hidden')
            }
        })
    }

    updateAudioLabel()
    {
        const label = this.element.querySelector('.js-audio-label')
        label.textContent = this.game.audio.muted ? 'Unmute Audio' : 'Mute Audio'
    }

    updateQualityLabel()
    {
        const label = this.element.querySelector('.js-quality-label')
        label.textContent = `Quality: ${this.game.quality.level === 0 ? 'High' : 'Low'}`
    }
}

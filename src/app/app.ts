import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('showcaseCanvas') private readonly canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private animationFrameId?: number;
  private readonly resizeHandler = () => this.startCanvasAnimation();

  readonly navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Media', href: '#media' },
    { label: 'Contact', href: '#contact' }
  ];

  readonly skills = [
    'Forms + Validation',
    'CSS Box Model',
    'Flexbox + Grid',
    'Responsive Design',
    'Accessibility (ARIA)'
  ];

  readonly projects = [
    {
      title: 'Accessible Study Dashboard',
      description: 'Semantic sections, keyboard-friendly navigation, and clear visual hierarchy.',
      stack: 'Angular + Tailwind + ARIA'
    },
    {
      title: 'Responsive Media Showcase',
      description: 'Audio, video, and canvas integrated in one adaptive layout.',
      stack: 'HTML5 Media + CSS Grid'
    },
    {
      title: 'Validated Contact Workflow',
      description: 'Reactive forms with required, email, and pattern validation.',
      stack: 'Angular Reactive Forms'
    }
  ];

  readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
    website: ['', Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i)],
    message: ['', [Validators.required, Validators.minLength(20)]]
  });

  submitted = false;
  sending = false;
  submitMessage = '';

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.startCanvasAnimation();
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  get nameInvalid(): boolean {
    const control = this.contactForm.controls.name;
    return control.invalid && (control.touched || this.submitted);
  }

  get emailInvalid(): boolean {
    const control = this.contactForm.controls.email;
    return control.invalid && (control.touched || this.submitted);
  }

  get roleInvalid(): boolean {
    const control = this.contactForm.controls.role;
    return control.invalid && (control.touched || this.submitted);
  }

  get websiteInvalid(): boolean {
    const control = this.contactForm.controls.website;
    return control.invalid && control.value.length > 0 && (control.touched || this.submitted);
  }

  get messageInvalid(): boolean {
    const control = this.contactForm.controls.message;
    return control.invalid && (control.touched || this.submitted);
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.submitMessage = '';
      return;
    }

    this.sending = true;
    const payload = this.contactForm.getRawValue();

    try {
      const result = await firstValueFrom(
        this.http.post<{ message: string }>('/api/contact', payload)
      );
      this.submitMessage = result.message;
      this.submitted = false;
      this.contactForm.reset();
    } catch {
      this.submitMessage = 'Unable to submit right now. Please try again in a moment.';
    } finally {
      this.sending = false;
    }
  }

  private startCanvasAnimation(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const render = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      context.clearRect(0, 0, width, height);
      context.fillStyle = '#0f172a';
      context.fillRect(0, 0, width, height);

      context.strokeStyle = 'rgba(34, 197, 94, 0.35)';
      context.lineWidth = 2;
      context.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const y = height / 2 + Math.sin((x + time * 0.08) / 28) * 26;
        x === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
      }
      context.stroke();

      context.fillStyle = 'rgba(249, 115, 22, 0.5)';
      for (let i = 0; i < 10; i += 1) {
        const barHeight = 20 + ((Math.sin(time * 0.003 + i) + 1) / 2) * (height - 40);
        context.fillRect(20 + i * 24, height - barHeight - 10, 14, barHeight);
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(render);
  }
}

'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/contexts/user-context';
import { SupportCategory, SUPPORT_CATEGORIES } from '@/lib/constants/support-categories';
import styles from './page.module.css';

type FormState = {
  category: SupportCategory | '';
  message: string;
  honeypot: string;
};

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

function SupportPageContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>({
    category: '',
    message: '',
    honeypot: '',
  });
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Pre-fill category from URL query parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && Object.values(SupportCategory).includes(categoryParam as SupportCategory)) {
      setFormState((prev) => ({
        ...prev,
        category: categoryParam as SupportCategory,
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formState.category,
          message: formState.message,
          email: user?.email || '',
          honeypot: formState.honeypot,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message. Please try again.');
      }

      setSubmitState('success');
      setFormState({
        category: '',
        message: '',
        honeypot: '',
      });

      setTimeout(() => {
        setSubmitState('idle');
      }, 5000);
    } catch (error) {
      setSubmitState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to send message. Please try again.'
      );
    }
  };

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.title}>Help & support</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formFields}>
            <div className={styles.fieldGroup}>
              <label htmlFor="category" className={styles.label}>
                Subject
              </label>
              <select
                id="category"
                value={formState.category}
                onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value as SupportCategory | '' }))}
                className={styles.select}
                required
                disabled={submitState === 'loading'}
              >
                <option value="">Select a category...</option>
                {SUPPORT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="message" className={styles.label}>
                Tell us what your problem is
              </label>
              <textarea
                id="message"
                value={formState.message}
                onChange={handleChange('message')}
                placeholder="Message..."
                className={styles.textarea}
                required
                disabled={submitState === 'loading'}
                rows={10}
              />
            </div>

            <input
              type="text"
              name="website"
              value={formState.honeypot}
              onChange={handleChange('honeypot')}
              className={styles.honeypot}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
          </div>

          {submitState === 'success' && (
            <div className={styles.successMessage}>
              Your message has been sent successfully! We&apos;ll get back to you soon.
            </div>
          )}

          {submitState === 'error' && (
            <div className={styles.errorMessage}>{errorMessage}</div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitState === 'loading' || submitState === 'success'}
          >
            <span className={styles.submitButtonText}>Send message</span>
            <div className={styles.submitButtonIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="16" cy="16" r="17" fill="#0a0a0a" />
                <path
                  d="M11 16L21 16M21 16L16 11M21 16L16 21"
                  stroke="#f9fafb"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="rotate(90 16 16)"
                />
              </svg>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>Help & support</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    }>
      <SupportPageContent />
    </Suspense>
  );
}


import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { signUpSchema, signInSchema, type SignUpFormData, type SignInFormData } from '../schemas/authSchema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { SplitCoin, Wordmark } from '../components/Brand'

export default function WagerAuth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const next = new URLSearchParams(location.search).get('next') ?? '/'

  const signInForm = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) })
  const signUpForm = useForm<SignUpFormData>({ resolver: zodResolver(signUpSchema) })

  async function handleSignIn(data: SignInFormData) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      navigate(next, { replace: true })
    }
  }

  async function handleSignUp(data: SignUpFormData) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          display_name: data.display_name,
          date_of_birth: data.date_of_birth,
        },
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Check your email to confirm.')
      navigate(next, { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2.5">
            <SplitCoin size={34} />
            <Wordmark className="text-[30px]" />
          </div>
          <h1 className="mt-4 font-display text-[34px] font-extrabold tracking-tight text-ink">Settle it 1v1.</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">Challenge friends. Win matches. Climb the leaderboard.</p>
        </div>

        <div className="rounded-[20px] border border-border bg-surface p-6">
          <div className="mb-6 flex gap-0.5 rounded-[11px] p-[3px]" style={{ background: 'hsl(var(--toggle-track))' }}>
            <button
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${mode === 'signin' ? 'bg-ink text-background' : 'text-muted-foreground'}`}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${mode === 'signup' ? 'bg-ink text-background' : 'text-muted-foreground'}`}
              onClick={() => setMode('signup')}
            >
              Create Account
            </button>
          </div>

          {mode === 'signin' ? (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" placeholder="you@example.com" {...signInForm.register('email')} />
                {signInForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{signInForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" placeholder="••••••••" {...signInForm.register('password')} />
                {signInForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{signInForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input id="signup-username" placeholder="jsmith99" {...signUpForm.register('username')} />
                  {signUpForm.formState.errors.username && (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-name">Display Name</Label>
                  <Input id="signup-name" placeholder="John Smith" {...signUpForm.register('display_name')} />
                  {signUpForm.formState.errors.display_name && (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.display_name.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="you@example.com" {...signUpForm.register('email')} />
                {signUpForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" placeholder="At least 8 characters" {...signUpForm.register('password')} />
                {signUpForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="signup-dob">Date of Birth</Label>
                <Input id="signup-dob" type="date" {...signUpForm.register('date_of_birth')} />
                {signUpForm.formState.errors.date_of_birth && (
                  <p className="text-xs text-destructive">{signUpForm.formState.errors.date_of_birth.message}</p>
                )}
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="age-confirm"
                  onCheckedChange={(checked) =>
                    signUpForm.setValue('age_confirmed', checked === true ? true : (undefined as unknown as true), { shouldValidate: true })
                  }
                />
                <label htmlFor="age-confirm" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I confirm that I am at least <strong>18 years old</strong> and agree to the Terms of Service.
                </label>
              </div>
              {signUpForm.formState.errors.age_confirmed && (
                <p className="text-xs text-destructive">{signUpForm.formState.errors.age_confirmed.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

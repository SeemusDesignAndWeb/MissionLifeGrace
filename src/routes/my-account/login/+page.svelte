<script lang="js">
	import { goto } from '$app/navigation';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	// Forgot Password state
	let showForgotPassword = false;
	let forgotPasswordEmail = '';
	let forgotPasswordLoading = false;
	let forgotPasswordSuccess = false;
	let forgotPasswordError = '';

	async function handleLogin(event) {
		event.preventDefault();
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/user/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const data = await response.json();

			if (response.ok) {
				notifySuccess('Logged in successfully');
				goto('/my-account');
			} else {
				error = data.error || 'Login failed';
				if (data.needsVerification) {
					error += ' You can request a new verification code on the verification page.';
				}
				notifyError(error);
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			notifyError(error);
		} finally {
			loading = false;
		}
	}

	async function handleForgotPassword() {
		if (!forgotPasswordEmail) {
			forgotPasswordError = 'Please enter your email address';
			return;
		}

		forgotPasswordLoading = true;
		forgotPasswordError = '';
		forgotPasswordSuccess = false;

		try {
			const response = await fetch('/api/user/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: forgotPasswordEmail })
			});

			// Always show success for security
			forgotPasswordSuccess = true;
			notifySuccess('If an account exists, a reset link has been sent.');
		} catch (err) {
			forgotPasswordError = 'An error occurred. Please try again.';
		} finally {
			forgotPasswordLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - My Account</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
	<div class="max-w-md w-full space-y-8">
		{#if !showForgotPassword}
			<div>
				<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
				<p class="mt-2 text-center text-sm text-gray-600">
					Access your booking details and make payments
				</p>
			</div>
			<form class="mt-8 space-y-6" on:submit={handleLogin}>
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
						{error}
					</div>
				{/if}
				<div class="rounded-md shadow-sm -space-y-px">
					<div>
						<label for="email" class="sr-only">Email address</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							bind:value={email}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
							placeholder="Email address"
						/>
					</div>
					<div>
						<label for="password" class="sr-only">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							bind:value={password}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
							placeholder="Password"
						/>
					</div>
				</div>

				<div class="flex items-center justify-end">
					<div class="text-sm">
						<button 
							type="button"
							class="font-medium text-primary hover:text-primary-dark"
							on:click={() => showForgotPassword = true}
						>
							Forgot your password?
						</button>
					</div>
				</div>

				<div>
					<button
						type="submit"
						disabled={loading}
						class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
					>
						{loading ? 'Signing in...' : 'Sign in'}
					</button>
				</div>

				<div class="text-center">
					<p class="text-sm text-gray-600">
						Don't have an account? 
						<a href="/my-account/register" class="font-medium text-primary hover:text-primary-dark">
							Register here
						</a>
					</p>
				</div>
			</form>
		{:else}
			<!-- Forgot Password Form -->
			<div>
				<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset Password</h2>
				<p class="mt-2 text-center text-sm text-gray-600">
					Enter your email address and we'll send you a link to reset your password.
				</p>
			</div>

			{#if forgotPasswordSuccess}
				<div class="bg-green-50 border border-green-200 text-green-700 p-4 rounded text-center">
					<p class="font-medium">Check your email</p>
					<p class="text-sm mt-1">If an account exists for {forgotPasswordEmail}, you will receive a reset link shortly.</p>
					<button
						type="button"
						class="mt-4 text-primary hover:text-primary-dark font-medium"
						on:click={() => {
							showForgotPassword = false;
							forgotPasswordSuccess = false;
							forgotPasswordEmail = '';
						}}
					>
						Return to login
					</button>
				</div>
			{:else}
				<form class="mt-8 space-y-6" on:submit|preventDefault={handleForgotPassword}>
					{#if forgotPasswordError}
						<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
							{forgotPasswordError}
						</div>
					{/if}
					
					<div>
						<label for="forgot-email" class="sr-only">Email address</label>
						<input
							id="forgot-email"
							name="email"
							type="email"
							required
							bind:value={forgotPasswordEmail}
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
							placeholder="Email address"
						/>
					</div>

					<div>
						<button
							type="submit"
							disabled={forgotPasswordLoading}
							class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
						>
							{forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
						</button>
					</div>

					<div class="text-center">
						<button
							type="button"
							class="text-sm font-medium text-primary hover:text-primary-dark"
							on:click={() => showForgotPassword = false}
						>
							Back to login
						</button>
					</div>
				</form>
			{/if}
		{/if}
	</div>
</div>

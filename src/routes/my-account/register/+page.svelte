<script lang="js">
	import { goto } from '$app/navigation';
	import { notifyError, notifySuccess } from '$lib/utils/notify';
	import { page } from '$app/stores';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;

	// Get bookingId from query params if present
	$: bookingId = $page.url.searchParams.get('bookingId') || '';

	async function handleRegister(event) {
		event.preventDefault();
		error = '';
		loading = true;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			notifyError(error);
			loading = false;
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			notifyError(error);
			loading = false;
			return;
		}

		try {
			const response = await fetch('/api/user/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					email, 
					password,
					bookingId: bookingId || null,
					name: email.split('@')[0]
				})
			});

			const data = await response.json();

			if (response.ok) {
				success = true;
				notifySuccess('Account created! Please check your email for the verification code.');
				// Redirect to verification page
				setTimeout(() => {
					goto(`/my-account/verify?email=${encodeURIComponent(email)}`);
				}, 2000);
			} else {
				error = data.error || 'Registration failed';
				notifyError(error);
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			notifyError(error);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Register - My Account</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Manage your bookings and make payments online
			</p>
		</div>
		{#if success}
			<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
				Account created! Redirecting to verification page...
			</div>
		{:else}
			<form class="mt-8 space-y-6" on:submit={handleRegister}>
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
						{error}
					</div>
				{/if}
				<div class="rounded-md shadow-sm space-y-4">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							bind:value={email}
							class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
							placeholder="your@email.com"
						/>
					</div>
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							bind:value={password}
							class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
							placeholder="At least 6 characters"
						/>
					</div>
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							required
							bind:value={confirmPassword}
							class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
							placeholder="Confirm your password"
						/>
					</div>
				</div>

				<div>
					<button
						type="submit"
						disabled={loading}
						class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
					>
						{loading ? 'Creating account...' : 'Create account'}
					</button>
				</div>

				<div class="text-center">
					<p class="text-sm text-gray-600">
						Already have an account? 
						<a href="/my-account/login" class="font-medium text-primary hover:text-primary-dark">
							Sign in here
						</a>
					</p>
				</div>
			</form>
		{/if}
	</div>
</div>



<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = '';
	let token = '';
	let newPassword = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;

	onMount(() => {
		email = $page.url.searchParams.get('email') || '';
		token = $page.url.searchParams.get('token') || '';
		
		if (!email || !token) {
			error = 'Invalid reset link. Please request a new password reset.';
		}
	});

	async function handleSubmit() {
		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (newPassword.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/user/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, token, newPassword })
			});

			const data = await response.json();

			if (response.ok) {
				success = true;
				setTimeout(() => {
					goto('/my-account/login');
				}, 3000);
			} else {
				error = data.error || 'Failed to reset password';
			}
		} catch (e) {
			error = 'An error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
			Reset your password
		</h2>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			{#if success}
				<div class="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-6 text-center">
					<h3 class="font-bold text-lg mb-2">Success!</h3>
					<p>Your password has been reset successfully.</p>
					<p class="mt-2 text-sm">Redirecting to login page...</p>
				</div>
				<div class="text-center">
					<a href="/my-account/login" class="text-primary hover:text-primary-dark font-medium">
						Click here if you are not redirected
					</a>
				</div>
			{:else}
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
						{error}
					</div>
				{/if}

				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700">
							Email address
						</label>
						<div class="mt-1">
							<input
								id="email"
								type="email"
								value={email}
								disabled
								class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
							/>
						</div>
					</div>

					<div>
						<label for="new-password" class="block text-sm font-medium text-gray-700">
							New Password
						</label>
						<div class="mt-1">
							<input
								id="new-password"
								name="new-password"
								type="password"
								required
								minlength="6"
								bind:value={newPassword}
								class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
							/>
						</div>
					</div>

					<div>
						<label for="confirm-password" class="block text-sm font-medium text-gray-700">
							Confirm New Password
						</label>
						<div class="mt-1">
							<input
								id="confirm-password"
								name="confirm-password"
								type="password"
								required
								bind:value={confirmPassword}
								class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={loading || !email || !token}
							class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
						>
							{loading ? 'Resetting...' : 'Reset Password'}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>


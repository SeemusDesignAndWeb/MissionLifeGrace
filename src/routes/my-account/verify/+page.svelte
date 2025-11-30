<script lang="js">
	import { goto } from '$app/navigation';
	import { notifyError, notifySuccess } from '$lib/utils/notify';
	import { page } from '$app/stores';

	let code = '';
	let loading = false;
	let resending = false;
	let error = '';
	let success = false;

	$: email = $page.url.searchParams.get('email') || '';

	async function handleVerify(event) {
		event.preventDefault();
		error = '';
		loading = true;

		if (!email) {
			error = 'Email is required';
			notifyError(error);
			loading = false;
			return;
		}

		try {
			const response = await fetch('/api/user/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, code })
			});

			const data = await response.json();

			if (response.ok) {
				success = true;
				notifySuccess('Email verified successfully!');
				setTimeout(() => {
					goto('/my-account');
				}, 2000);
			} else {
				error = data.error || 'Verification failed';
				notifyError(error);
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			notifyError(error);
		} finally {
			loading = false;
		}
	}

	async function resendCode() {
		if (!email) {
			notifyError('Email is required');
			return;
		}

		resending = true;
		try {
			const response = await fetch('/api/user/resend-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await response.json();

			if (response.ok) {
				notifySuccess('Verification code sent to your email');
			} else {
				notifyError(data.error || 'Failed to resend code');
			}
		} catch (err) {
			notifyError('An error occurred. Please try again.');
		} finally {
			resending = false;
		}
	}
</script>

<svelte:head>
	<title>Verify Email - My Account</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify your email</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				{#if email}
					Enter the verification code sent to <strong>{email}</strong>
				{:else}
					Please enter your email and verification code
				{/if}
			</p>
		</div>
		{#if success}
			<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-center">
				Email verified! Redirecting to your account...
			</div>
		{:else}
			<form class="mt-8 space-y-6" on:submit={handleVerify}>
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
						{error}
					</div>
				{/if}
				<div>
					<label for="code" class="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
					<input
						id="code"
						name="code"
						type="text"
						required
						maxlength="6"
						bind:value={code}
						class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-center text-2xl tracking-widest"
						placeholder="000000"
					/>
					<p class="mt-2 text-xs text-gray-500">Enter the 6-digit code from your email</p>
				</div>

				<div>
					<button
						type="submit"
						disabled={loading || !email}
						class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
					>
						{loading ? 'Verifying...' : 'Verify Email'}
					</button>
				</div>

				<div class="text-center">
					<p class="text-sm text-gray-600">
						Didn't receive the code? 
						<button
							type="button"
							on:click={resendCode}
							disabled={resending || !email}
							class="font-medium text-primary hover:text-primary-dark disabled:opacity-50"
						>
							{resending ? 'Sending...' : 'Resend code'}
						</button>
					</p>
				</div>
			</form>
		{/if}
	</div>
</div>



<script>
	export let contactInfo = {
		address: '542 Westhorne Avenue, Eltham, London, SE9 6RR',
		email: 'enquiries@egcc.co.uk',
		phone: ''
	};

	let formData = {
		name: '',
		email: '',
		phone: '',
		message: '',
		website: '' // Honeypot field - bots will fill this, humans won't see it
	};
	
	let formStartTime = Date.now();

	let success = false;
	let error = '';
	let submitting = false;
	let fieldErrors = {};

	function validateField(field, value) {
		switch (field) {
			case 'name':
				if (!value || value.trim().length < 2) {
					return 'Name must be at least 2 characters';
				}
				return '';
			case 'email':
				const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!value || !emailPattern.test(value)) {
					return 'Please enter a valid email address';
				}
				return '';
			case 'phone':
				if (!value || value.trim().length < 5) {
					return 'Please enter a valid phone number';
				}
				return '';
			case 'message':
				if (!value || value.trim().length < 10) {
					return 'Message must be at least 10 characters';
				}
				return '';
			default:
				return '';
		}
	}

	function handleBlur(field, value) {
		const error = validateField(field, value);
		if (error) {
			fieldErrors[field] = error;
		} else {
			delete fieldErrors[field];
		}
		fieldErrors = { ...fieldErrors };
	}

	function handleInput(field, value) {
		formData[field] = value;
		if (fieldErrors[field]) {
			const error = validateField(field, value);
			if (!error) {
				delete fieldErrors[field];
				fieldErrors = { ...fieldErrors };
			}
		}
	}

	async function handleSubmit(event) {
		event.preventDefault();
		submitting = true;
		success = false;
		error = '';

		// Honeypot check - if this field is filled, it's a bot
		if (formData.website && formData.website.trim() !== '') {
			// Silently fail - don't let bots know they were caught
			submitting = false;
			return;
		}

		// Check minimum time - humans need at least 3 seconds to fill the form
		const timeSpent = (Date.now() - formStartTime) / 1000;
		if (timeSpent < 3) {
			error = 'Please take your time filling out the form.';
			submitting = false;
			return;
		}

		const errors = {};
		// Don't validate honeypot field
		['name', 'email', 'phone', 'message'].forEach((field) => {
			const fieldError = validateField(field, formData[field]);
			if (fieldError) {
				errors[field] = fieldError;
			}
		});

		if (Object.keys(errors).length > 0) {
			fieldErrors = errors;
			submitting = false;
			return;
		}

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: formData.name,
					email: formData.email,
					phone: formData.phone,
					message: formData.message,
					formTime: timeSpent // Send time spent for server-side validation
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				success = true;
				formData = { name: '', email: '', phone: '', message: '', website: '' };
				fieldErrors = {};
				formStartTime = Date.now(); // Reset timer for next submission
				setTimeout(() => {
					success = false;
				}, 5000);
			} else {
				error = result.error || 'Failed to send message. Please try again.';
			}
		} catch (err) {
			error = 'Network error. Please check your connection and try again.';
			console.error('Form submission error:', err);
		} finally {
			submitting = false;
		}
	}
</script>

<section id="contact" class="py-12 bg-gradient-to-br from-gray-50 to-gray-100">
	<div class="container mx-auto px-4 max-w-6xl">
		<!-- Header -->
		<div class="text-center mb-8">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Contact Us</h2>
			<p class="text-gray-600">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
		</div>

		<!-- Contact Form and Info Side by Side -->
		<div class="grid md:grid-cols-3 gap-6">
			<!-- Contact Information - Left Side -->
			<div class="md:col-span-1 space-y-4">
				{#if contactInfo.address}
					<div class="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</h3>
								<p class="text-gray-900 text-sm leading-relaxed">{contactInfo.address}</p>
							</div>
						</div>
					</div>
				{/if}
				
				{#if contactInfo.email}
					<div class="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</h3>
								<a href="mailto:{contactInfo.email}" class="text-primary hover:text-primary/80 transition-colors text-sm font-medium break-all block">
									{contactInfo.email}
								</a>
							</div>
						</div>
					</div>
				{/if}
				
				{#if contactInfo.phone}
					<div class="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</h3>
								<a href="tel:{contactInfo.phone.replace(/\s/g, '')}" class="text-primary hover:text-primary/80 transition-colors text-sm font-medium block">
									{contactInfo.phone}
								</a>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Contact Form - Right Side -->
			<div class="md:col-span-2 bg-white rounded-xl shadow-lg p-6 md:p-8">
				<h3 class="text-xl font-bold text-gray-900 mb-5">Send us a Message</h3>

			{#if success}
				<div class="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-lg flex items-start gap-2">
					<svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div>
						<p class="text-green-800 font-medium text-sm">Message sent successfully!</p>
						<p class="text-green-700 text-xs mt-0.5">We'll get back to you soon.</p>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start gap-2">
					<svg class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<p class="text-red-800 text-sm">{error}</p>
				</div>
			{/if}

			<form on:submit={handleSubmit} class="space-y-4">
				<!-- Name, Email, Phone Row -->
				<div class="grid md:grid-cols-3 gap-4">
					<!-- Name -->
					<div>
						<label for="name" class="block text-xs font-semibold text-gray-700 mb-1.5">
							Name <span class="text-red-500">*</span>
						</label>
						<input
							id="name"
							type="text"
							bind:value={formData.name}
							on:blur={() => handleBlur('name', formData.name)}
							on:input={(e) => handleInput('name', e.currentTarget.value)}
							required
							placeholder="Your full name"
							class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm {fieldErrors.name
								? 'border-red-500'
								: ''}"
						/>
						{#if fieldErrors.name}
							<p class="mt-1 text-xs text-red-600 flex items-center gap-1">
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{fieldErrors.name}
							</p>
						{/if}
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="block text-xs font-semibold text-gray-700 mb-1.5">
							Email <span class="text-red-500">*</span>
						</label>
						<input
							id="email"
							type="email"
							bind:value={formData.email}
							on:blur={() => handleBlur('email', formData.email)}
							on:input={(e) => handleInput('email', e.currentTarget.value)}
							required
							placeholder="your.email@example.com"
							class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm {fieldErrors.email
								? 'border-red-500'
								: ''}"
						/>
						{#if fieldErrors.email}
							<p class="mt-1 text-xs text-red-600 flex items-center gap-1">
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{fieldErrors.email}
							</p>
						{/if}
					</div>

					<!-- Phone -->
					<div>
						<label for="phone" class="block text-xs font-semibold text-gray-700 mb-1.5">
							Phone <span class="text-red-500">*</span>
						</label>
						<input
							id="phone"
							type="tel"
							bind:value={formData.phone}
							on:blur={() => handleBlur('phone', formData.phone)}
							on:input={(e) => handleInput('phone', e.currentTarget.value)}
							required
							placeholder="Your phone number"
							class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm {fieldErrors.phone
								? 'border-red-500'
								: ''}"
						/>
						{#if fieldErrors.phone}
							<p class="mt-1 text-xs text-red-600 flex items-center gap-1">
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{fieldErrors.phone}
							</p>
						{/if}
					</div>
				</div>

				<!-- Message -->
				<div>
					<label for="message" class="block text-xs font-semibold text-gray-700 mb-1.5">
						Message <span class="text-red-500">*</span>
					</label>
					<textarea
						id="message"
						bind:value={formData.message}
						on:blur={() => handleBlur('message', formData.message)}
						on:input={(e) => handleInput('message', e.currentTarget.value)}
						rows="4"
						required
						placeholder="Tell us how we can help you..."
						class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none text-sm {fieldErrors.message
							? 'border-red-500'
							: ''}"
					></textarea>
					{#if fieldErrors.message}
						<p class="mt-1 text-xs text-red-600 flex items-center gap-1">
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							{fieldErrors.message}
						</p>
					{/if}
				</div>

					<!-- Honeypot field - hidden from users but visible to bots -->
					<div style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
						<label for="website">Website (leave blank)</label>
						<input
							type="text"
							id="website"
							name="website"
							tabindex="-1"
							autocomplete="off"
							bind:value={formData.website}
						/>
					</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={submitting}
					class="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
				>
					{#if submitting}
						<svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span>Sending...</span>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
						</svg>
						<span>Send Message</span>
					{/if}
				</button>
			</form>
		</div>
	</div>
</section>

<script lang="ts">
	let formData = {
		name: '',
		email: '',
		subject: '',
		message: ''
	};

	let success = false;
	let error = false;
	let submitting = false;

	async function handleSubmit(event: Event) {
		event.preventDefault();
		submitting = true;
		success = false;
		error = false;

		// Basic validation
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (
			!emailPattern.test(formData.email) ||
			formData.message.length <= 1 ||
			formData.name.length <= 1
		) {
			error = true;
			submitting = false;
			return;
		}

		// Simulate form submission (replace with actual API call)
		setTimeout(() => {
			success = true;
			submitting = false;
			formData = { name: '', email: '', subject: '', message: '' };
		}, 1000);
	}
</script>

<section id="contact" class="py-20 bg-white">
	<div class="container mx-auto px-4">
		<div class="grid md:grid-cols-2 gap-12">
			<!-- Google Map -->
			<div class="w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
				<iframe
					src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2487.1234567890!2d0.0488!3d51.4523!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTHCsDI3JzA4LjMiTiAwwrAwMic1NS43IkU!5e0!3m2!1sen!2suk!4v1234567890123"
					width="100%"
					height="100%"
					style="border:0;"
					title="Eltham Green Community Church Location"
					allowfullscreen=""
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
				></iframe>
			</div>

			<!-- Contact Form -->
			<div>
				<div class="mb-8">
					<div class="section-title">
						<h2>Contact Us</h2>
					</div>
				</div>

				<form
					method="POST"
					on:submit={handleSubmit}
					class="space-y-4"
				>
					{#if success}
						<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
							Your message has been sent successfully.
						</div>
					{/if}

					{#if error}
						<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
							E-mail must be valid and message must be longer than 1 character.
						</div>
					{/if}

					<div class="grid md:grid-cols-2 gap-4">
						<input
							type="text"
							bind:value={formData.name}
							placeholder="Full name"
							required
							class="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
						<input
							type="email"
							bind:value={formData.email}
							placeholder="Email address"
							required
							class="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
					</div>

					<input
						type="text"
						bind:value={formData.subject}
						placeholder="Subject"
						class="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
					/>

					<textarea
						bind:value={formData.message}
						rows="6"
						placeholder="How can we help you? Share your message or prayer request..."
						required
						class="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
					></textarea>

					<button
						type="submit"
						disabled={submitting}
						class="w-full bg-primary text-white px-6 py-3 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{submitting ? 'Sending...' : 'Send Message'}
					</button>
				</form>
			</div>
		</div>
	</div>
</section>


<script lang="js">
	import { onMount } from 'svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	export let params = {};

	let home = {
		aboutLabel: '',
		aboutTitle: '',
		aboutContent: '',
		aboutImage: '',
		visionLabel: 'Our Vision',
		visionTitle: 'We Believe',
		visionText: 'We believe every church exists to be part of God\'s mission to show the world Christ and that we are better equipped to do this in partnership with other churches. As a network our focus is to encourage each other through sharing our hearts, ideas and lessons learned along the way, to challenge one another to stay true to the course and to invest in helping people fulfil their God given calling. We believe that by journeying together we can see God do great things in our nation and around the world.'
	};
	let slides = [];
	let loading = true;
	let saving = false;
	let saved = false;
	let showImagePicker = false;
	let currentImagePickerTarget = null; // 'about' or 'slide'
	let editingSlide = null;
	let showSlideForm = false;

	onMount(async () => {
		await Promise.all([loadHome(), loadSlides()]);
	});

	async function loadHome() {
		try {
			const response = await fetch('/api/content?type=home');
			home = await response.json();
		} catch (error) {
			console.error('Failed to load home page data:', error);
		} finally {
			loading = false;
		}
	}

	async function loadSlides() {
		try {
			const response = await fetch('/api/content?type=hero-slides');
			slides = await response.json();
		} catch (error) {
			console.error('Failed to load hero slides:', error);
		}
	}

	function openImagePicker(target = 'about') {
		currentImagePickerTarget = target;
		showImagePicker = true;
	}

	function handleImageSelect(imagePath) {
		if (currentImagePickerTarget === 'about') {
			home.aboutImage = imagePath;
		} else if (currentImagePickerTarget === 'slide' && editingSlide) {
			editingSlide.image = imagePath;
		}
		showImagePicker = false;
		currentImagePickerTarget = null;
	}

	async function saveHome() {
		saving = true;
		saved = false;
		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'home', data: home })
			});

			if (response.ok) {
				saved = true;
				setTimeout(() => (saved = false), 3000);
			} else {
				const error = await response.json();
				notifyError(error.error || 'Failed to save home page');
			}
		} catch (error) {
			console.error('Failed to save home page:', error);
			notifyError('Failed to save home page');
		} finally {
			saving = false;
		}
	}

	function startEditSlide(slide) {
		editingSlide = slide
			? { ...slide }
			: {
					id: '',
					title: '',
					subtitle: '',
					cta: '',
					ctaLink: '',
					image: ''
				};
		showSlideForm = true;
	}

	function cancelEditSlide() {
		editingSlide = null;
		showSlideForm = false;
	}

	async function saveSlide() {
		if (!editingSlide) return;

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'hero-slide', data: editingSlide })
			});

			if (response.ok) {
				await loadSlides();
				cancelEditSlide();
				notifySuccess('Hero slide saved successfully');
			}
		} catch (error) {
			console.error('Failed to save hero slide:', error);
			notifyError('Failed to save hero slide');
		}
	}

	async function deleteSlide(id) {
		if (!confirm('Are you sure you want to delete this hero slide?')) return;

		try {
			const response = await fetch(`/api/content?type=hero-slide&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadSlides();
				notifySuccess('Hero slide deleted successfully');
			}
		} catch (error) {
			console.error('Failed to delete hero slide:', error);
			notifyError('Failed to delete hero slide');
		}
	}
</script>

<svelte:head>
	<title>Home Page - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Home Page Settings</h1>
			<p class="text-gray-600">Edit the "About" section content that appears on the home page.</p>
		</div>

		{#if loading}
			<div class="text-center py-12">
				<p class="text-gray-500">Loading...</p>
			</div>
		{:else}
			<div class="bg-white rounded-lg shadow-md p-6 space-y-6">
				<!-- Top Save Button -->
				<div class="flex justify-end pb-4 border-b">
					<button
						on:click={saveHome}
						disabled={saving}
						class="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
					</button>
				</div>
				<!-- About Label -->
				<div>
					<label class="block text-sm font-medium mb-1">About Section Label</label>
					<p class="text-xs text-gray-500 mb-2">
						The small label that appears above the title (e.g., "Our Story")
					</p>
					<input
						type="text"
						bind:value={home.aboutLabel}
						class="w-full px-3 py-2 border rounded"
						placeholder="Our Story"
					/>
				</div>

				<!-- About Title -->
				<div>
					<label class="block text-sm font-medium mb-1">About Section Title</label>
					<p class="text-xs text-gray-500 mb-2">
						The main heading for the about section. HTML is supported (e.g., for colored text).
					</p>
					<input
						type="text"
						bind:value={home.aboutTitle}
						class="w-full px-3 py-2 border rounded"
						placeholder="Welcome to Mission Life Grace"
					/>
				</div>

				<!-- About Content -->
				<div>
					<label class="block text-sm font-medium mb-1">About Section Content</label>
					<p class="text-xs text-gray-500 mb-2">
						The main content text. Use the rich text editor to format your content.
					</p>
					<div class="relative" style="height: 400px;">
						<RichTextEditor bind:value={home.aboutContent} height="400px" />
					</div>
				</div>

				<!-- About Image -->
				<div>
					<label class="block text-sm font-medium mb-1">About Section Image</label>
					<p class="text-xs text-gray-500 mb-2">
						The image displayed in the about section.
					</p>
					<div class="flex gap-3">
						<input
							type="text"
							bind:value={home.aboutImage}
							class="flex-1 px-3 py-2 border rounded"
							placeholder="Image URL"
						/>
						<button
							type="button"
							on:click={openImagePicker}
							class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
						>
							Choose Image
						</button>
					</div>
					{#if home.aboutImage}
						<div class="mt-3">
							<img
								src={home.aboutImage}
								alt="About section preview"
								class="max-w-xs rounded border"
								on:error={(e) => {
									e.target.style.display = 'none';
								}}
							/>
						</div>
					{/if}
				</div>

				<!-- Save Button -->
				<div class="flex justify-end pt-4 border-t">
					<button
						on:click={saveHome}
						disabled={saving}
						class="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
					</button>
				</div>
			</div>

			<!-- Vision Section -->
			<div class="bg-white rounded-lg shadow-md p-6 mt-8 space-y-6">
				<div class="flex justify-between items-center pb-4 border-b">
					<div>
						<h2 class="text-2xl font-bold text-gray-900 mb-2">Vision Section</h2>
						<p class="text-gray-600 text-sm">Edit the "Vision" section content that appears on the home page below the About section.</p>
					</div>
					<button
						on:click={saveHome}
						disabled={saving}
						class="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
					</button>
				</div>

				<!-- Vision Label -->
				<div>
					<label class="block text-sm font-medium mb-1">Vision Section Label</label>
					<p class="text-xs text-gray-500 mb-2">
						The small label that appears above the vision title (e.g., "Our Vision")
					</p>
					<input
						type="text"
						bind:value={home.visionLabel}
						class="w-full px-3 py-2 border rounded"
						placeholder="Our Vision"
					/>
				</div>

				<!-- Vision Title -->
				<div>
					<label class="block text-sm font-medium mb-1">Vision Section Title</label>
					<p class="text-xs text-gray-500 mb-2">
						The main heading for the vision section (e.g., "We Believe")
					</p>
					<input
						type="text"
						bind:value={home.visionTitle}
						class="w-full px-3 py-2 border rounded"
						placeholder="We Believe"
					/>
				</div>

				<!-- Vision Text -->
				<div>
					<label class="block text-sm font-medium mb-1">Vision Text</label>
					<p class="text-xs text-gray-500 mb-2">
						The main vision statement text. This will be displayed in a prominent, styled section on the home page.
					</p>
					<textarea
						bind:value={home.visionText}
						rows="6"
						class="w-full px-3 py-2 border rounded"
						placeholder="Enter your vision statement..."
					></textarea>
				</div>

				<!-- Save Button -->
				<div class="flex justify-end pt-4 border-t">
					<button
						on:click={saveHome}
						disabled={saving}
						class="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
					</button>
				</div>
			</div>

			<!-- Hero Slides Section -->
			<div class="bg-white rounded-lg shadow-md p-6 mt-8">
				<div class="flex justify-between items-center mb-6">
					<div>
						<h2 class="text-2xl font-bold text-gray-900 mb-2">Hero Slides</h2>
						<p class="text-gray-600 text-sm">Manage the rotating hero slides displayed on the home page.</p>
					</div>
					<button
						on:click={() => startEditSlide()}
						class="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
					>
						+ Add New Slide
					</button>
				</div>

				{#if showSlideForm && editingSlide}
					<div class="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-primary/20">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-xl font-bold">
								{editingSlide.id ? 'Edit Hero Slide' : 'New Hero Slide'}
							</h3>
							<div class="flex gap-2">
								<button
									on:click={saveSlide}
									class="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
								>
									Save
								</button>
								<button
									on:click={cancelEditSlide}
									class="px-4 py-2 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"
								>
									Cancel
								</button>
							</div>
						</div>
						<div class="grid md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium mb-1">ID</label>
								<input
									type="text"
									bind:value={editingSlide.id}
									class="w-full px-3 py-2 border rounded-lg"
									placeholder="e.g., slide-1"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium mb-1">Title</label>
								<input
									type="text"
									bind:value={editingSlide.title}
									class="w-full px-3 py-2 border rounded-lg"
									placeholder="Main heading"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium mb-1">Subtitle</label>
								<input
									type="text"
									bind:value={editingSlide.subtitle}
									class="w-full px-3 py-2 border rounded-lg"
									placeholder="Supporting text"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium mb-1">Call to Action Text</label>
								<input
									type="text"
									bind:value={editingSlide.cta}
									class="w-full px-3 py-2 border rounded-lg"
									placeholder="e.g., Learn More"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium mb-1">Call to Action Link</label>
								<input
									type="text"
									bind:value={editingSlide.ctaLink}
									class="w-full px-3 py-2 border rounded-lg"
									placeholder="/im-new"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium mb-1">Background Image</label>
								<div class="flex gap-2">
									<input
										type="text"
										bind:value={editingSlide.image}
										class="flex-1 px-3 py-2 border rounded-lg"
										placeholder="Image URL"
									/>
									<button
										type="button"
										on:click={() => openImagePicker('slide')}
										class="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
									>
										Select
									</button>
								</div>
								{#if editingSlide.image}
									<div class="mt-2">
										<img
											src={editingSlide.image}
											alt="Preview"
											class="max-w-xs h-32 object-cover rounded-lg border"
											on:error={(e) => {
												e.target.style.display = 'none';
											}}
										/>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				{#if slides.length === 0}
					<p class="text-gray-600 text-center py-8">No hero slides found. Add your first slide!</p>
				{:else}
					<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each slides as slide}
							<div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
								{#if slide.image}
									<img
										src={slide.image}
										alt={slide.title}
										class="w-full h-32 object-cover rounded-lg mb-3"
										on:error={(e) => {
											e.target.style.display = 'none';
										}}
									/>
								{/if}
								<h4 class="font-semibold text-gray-900 mb-1">{slide.title || 'Untitled'}</h4>
								<p class="text-sm text-gray-600 mb-2 line-clamp-2">{slide.subtitle || ''}</p>
								{#if slide.cta}
									<p class="text-xs text-primary font-medium mb-3">{slide.cta}</p>
								{/if}
								<div class="flex gap-2">
									<button
										on:click={() => startEditSlide(slide)}
										class="flex-1 px-3 py-1.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors text-sm"
									>
										Edit
									</button>
									<button
										on:click={() => deleteSlide(slide.id)}
										class="flex-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors text-sm"
									>
										Delete
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<ImagePicker open={showImagePicker} onSelect={handleImageSelect} on:close={() => (showImagePicker = false)} />


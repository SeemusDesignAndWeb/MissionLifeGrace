<script lang="js">
	import { onMount } from 'svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	export let params = {};

	let contact = {
		address: '',
		phone: '',
		email: '',
		googleMapsUrl: ''
	};
	let youtubePlaylistId = '';
	let youtubeChannelId = '';
	let spotifyShowUrl = '';
	let showLatestMessagePopup = false;
	let loading = true;
	let saving = false;
	let saved = false;

	onMount(async () => {
		await loadSettings();
	});

	async function loadSettings() {
		try {
			const [contactRes, settingsRes] = await Promise.all([
				fetch('/api/content?type=contact'),
				fetch('/api/content?type=settings')
			]);
			contact = await contactRes.json();
			const settings = await settingsRes.json();
			youtubePlaylistId = settings.youtubePlaylistId || '';
			youtubeChannelId = settings.youtubeChannelId || '';
			spotifyShowUrl = settings.spotifyShowUrl || '';
			showLatestMessagePopup = settings.showLatestMessagePopup || false;
		} catch (error) {
			console.error('Failed to load settings:', error);
		} finally {
			loading = false;
		}
	}

	async function saveAllSettings() {
		saving = true;
		saved = false;
		try {
			// Save contact info
			await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'contact', data: contact })
			});

			// Save other settings
			const currentSettings = await fetch('/api/content?type=settings').then(r => r.json());
			const mergedSettings = {
				...currentSettings,
				youtubePlaylistId: youtubePlaylistId,
				youtubeChannelId: youtubeChannelId,
				spotifyShowUrl: spotifyShowUrl,
				showLatestMessagePopup: showLatestMessagePopup
			};
			
			await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'settings', data: mergedSettings })
			});

			saved = true;
			notifySuccess('Settings saved successfully');
			setTimeout(() => (saved = false), 3000);
		} catch (error) {
			console.error('Failed to save settings:', error);
			notifyError('Failed to save settings. Please try again.');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Settings - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-3xl font-bold">Settings</h1>
		<button
			on:click={saveAllSettings}
			disabled={saving || loading}
			class="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
		>
			{#if saving}
				<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
				</svg>
				Saving...
			{:else}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
				Save All Settings
			{/if}
		</button>
	</div>

	{#if saved}
		<div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
			Settings saved successfully!
		</div>
	{/if}

	{#if loading}
		<div class="text-center py-12">
			<p class="text-gray-600">Loading settings...</p>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- Contact Information -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
				<div class="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
					<div class="flex items-center gap-3">
						<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
						</svg>
						<h2 class="text-xl font-bold text-gray-900">Contact Information</h2>
					</div>
					<p class="text-sm text-gray-600 mt-1 ml-9">Update contact details displayed on the website</p>
				</div>
				<div class="p-6">
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<label for="contact-email" class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
							<input
								id="contact-email"
								type="email"
								bind:value={contact.email}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
								placeholder="enquiries@missionlifegrace.net"
							/>
						</div>
						<div>
							<label for="contact-phone" class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
							<input
								id="contact-phone"
								type="text"
								bind:value={contact.phone}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
								placeholder="020 8850 1331"
							/>
						</div>
						<div class="md:col-span-2">
							<label for="contact-address" class="block text-sm font-medium text-gray-700 mb-2">Address</label>
							<textarea
								id="contact-address"
								bind:value={contact.address}
								rows="3"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
								placeholder="542 Westhorne Avenue, Eltham, London, SE9 6RR"
							></textarea>
						</div>
						<div class="md:col-span-2">
							<label for="contact-googlemaps" class="block text-sm font-medium text-gray-700 mb-2">Google Maps URL</label>
							<input
								id="contact-googlemaps"
								type="url"
								bind:value={contact.googleMapsUrl}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
								placeholder="https://maps.google.com/..."
							/>
							<p class="text-xs text-gray-500 mt-1">Optional: Link to Google Maps location</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Media Settings -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
				<div class="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
					<div class="flex items-center gap-3">
						<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
						</svg>
						<h2 class="text-xl font-bold text-gray-900">Media Settings</h2>
					</div>
					<p class="text-sm text-gray-600 mt-1 ml-9">Configure YouTube and Spotify integration</p>
				</div>
				<div class="p-6 space-y-6">
					<!-- YouTube Settings -->
					<div class="border-l-4 border-red-500 pl-4">
						<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
								<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
							</svg>
							YouTube
						</h3>
						<div class="space-y-4">
							<div>
								<label for="youtube-channel-id" class="block text-sm font-medium text-gray-700 mb-2">YouTube Channel ID</label>
								<input
									id="youtube-channel-id"
									type="text"
									bind:value={youtubeChannelId}
									class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
									placeholder="UCqRV8s8Vzza9zScNpQz8CTw"
								/>
								<p class="text-xs text-gray-500 mt-1">Enter the YouTube channel ID to show all videos from the channel</p>
							</div>
							<div>
								<label for="youtube-playlist-id" class="block text-sm font-medium text-gray-700 mb-2">YouTube Playlist ID (Optional)</label>
								<input
									id="youtube-playlist-id"
									type="text"
									bind:value={youtubePlaylistId}
									class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
									placeholder="PLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
								/>
								<p class="text-xs text-gray-500 mt-1">Alternatively, enter a specific playlist ID. Channel ID takes priority if both are set.</p>
							</div>
						</div>
					</div>

					<!-- Spotify Settings -->
					<div class="border-l-4 border-green-500 pl-4">
						<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.359.24-.66.54-.84 3.9-1.319 7.679-.6 10.921 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.14C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
							</svg>
							Spotify
						</h3>
						<div>
							<label for="spotify-show-url" class="block text-sm font-medium text-gray-700 mb-2">Spotify Show URL</label>
							<input
								id="spotify-show-url"
								type="url"
								bind:value={spotifyShowUrl}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
								placeholder="https://open.spotify.com/show/..."
							/>
							<p class="text-xs text-gray-500 mt-1">Enter the full Spotify show URL for the audio/sermons page</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Display Settings -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
				<div class="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-gray-200">
					<div class="flex items-center gap-3">
						<svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
						</svg>
						<h2 class="text-xl font-bold text-gray-900">Display Settings</h2>
					</div>
					<p class="text-sm text-gray-600 mt-1 ml-9">Control popups and notifications on the homepage</p>
				</div>
				<div class="p-6">
					<div class="space-y-4">
						<div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
							<input
								type="checkbox"
								id="show-latest-message-popup"
								bind:checked={showLatestMessagePopup}
								class="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
							/>
							<div class="flex-1">
								<label for="show-latest-message-popup" class="block text-sm font-medium text-gray-900 mb-1">
									Show Latest Message Popup
								</label>
								<p class="text-xs text-gray-600">
									Displays the latest YouTube video recorded in the last 5 days. <strong class="text-gray-900">When enabled, this will override the Event Highlight Banner.</strong> The Event Highlight Banner is controlled in the Events section by checking the "Highlight" checkbox on individual events.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

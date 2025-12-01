<script>
	import { onMount } from 'svelte';
	import HelpIcon from '$lib/components/HelpIcon.svelte';
	import { getHelpContent } from '$lib/utils/helpContent';

	export let data;
	export let params = {};

	// Access level constants
	const ACCESS_LEVELS = {
		FULL_ACCESS: 'full_access',
		EDITOR_ACCESS: 'editor_access',
		CONFERENCE_ACCESS: 'conference_access'
	};

	// Get access level and admin user from data
	$: accessLevel = data?.accessLevel || null;
	$: adminUser = data?.adminUser || null;

	// Helper function to check if user has access
	function hasAccess(requiredLevel) {
		if (!accessLevel) return false;
		const levels = {
			[ACCESS_LEVELS.FULL_ACCESS]: 3,
			[ACCESS_LEVELS.EDITOR_ACCESS]: 2,
			[ACCESS_LEVELS.CONFERENCE_ACCESS]: 1
		};
		return levels[accessLevel] >= levels[requiredLevel];
	}

	// Format access level for display
	function formatAccessLevel(level) {
		if (!level) return '';
		const labels = {
			[ACCESS_LEVELS.FULL_ACCESS]: 'Full Access',
			[ACCESS_LEVELS.EDITOR_ACCESS]: 'Editor Access',
			[ACCESS_LEVELS.CONFERENCE_ACCESS]: 'Conference Access'
		};
		return labels[level] || level;
	}

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
	}

	// Reactive calculations for charts
	$: totalAttendees = data.latestConferenceStats ? data.latestConferenceStats.totalAttendees : 0;
	$: adultCount = data.latestConferenceStats ? data.latestConferenceStats.adultAttendees : 0;
	$: teenCount = data.latestConferenceStats ? data.latestConferenceStats.teenAttendees : 0;
	$: childCount = data.latestConferenceStats ? data.latestConferenceStats.childAttendees : 0;
	$: campingCount = data.latestConferenceStats ? data.latestConferenceStats.campingAttendees : 0;
	$: nonCampingCount = data.latestConferenceStats ? data.latestConferenceStats.nonCampingAttendees : 0;
	
	// Bar chart calculations for camping
	$: maxCamping = Math.max(campingCount, nonCampingCount, 1);
	$: campingBarHeight = (campingCount / maxCamping) * 100;
	$: nonCampingBarHeight = (nonCampingCount / maxCamping) * 100;
</script>

<svelte:head>
	<title>Admin Dashboard - MLG</title>
</svelte:head>

<div class="container mx-auto px-4 py-4 mt-8">
	<!-- Page Header with Help -->
	<div class="flex items-center gap-2 mb-6">
		<h1 class="text-3xl font-bold">Admin Dashboard</h1>
		<HelpIcon helpId="admin-dashboard" position="right">
			{@html getHelpContent('admin-dashboard').content}
		</HelpIcon>
	</div>
	
	<!-- User Info Header -->
	{#if adminUser}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
						<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</div>
					<div>
						<div class="text-lg font-semibold text-gray-900">{adminUser.name}</div>
						<div class="text-sm text-gray-600">{formatAccessLevel(accessLevel)}</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<div class="space-y-4">
		<!-- Individual Items Row: Pages, Team, Admin Users, Settings -->
		<div class="grid md:grid-cols-4 gap-3">
			<!-- Pages -->
			{#if !accessLevel || hasAccess(ACCESS_LEVELS.EDITOR_ACCESS)}
				<a
					href="/admin/pages"
					class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 shadow-md border-2 border-blue-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
				>
					<div class="flex items-center gap-3 mb-2">
						<div class="p-2 bg-blue-500 rounded-lg">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
							</svg>
						</div>
						<h2 class="text-lg font-bold text-gray-900">Pages</h2>
					</div>
					<p class="text-xs text-gray-600">Manage all pages including home</p>
				</a>

				<!-- Team -->
				<a
					href="/admin/team"
					class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 shadow-md border-2 border-purple-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
				>
					<div class="flex items-center gap-3 mb-2">
						<div class="p-2 bg-purple-500 rounded-lg">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
							</svg>
						</div>
						<h2 class="text-lg font-bold text-gray-900">Team</h2>
					</div>
					<p class="text-xs text-gray-600">Manage team members</p>
				</a>
			{/if}

			<!-- Admin Users (Full Access Only) -->
			{#if hasAccess(ACCESS_LEVELS.FULL_ACCESS)}
				<a
					href="/admin/users"
					class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 shadow-md border-2 border-red-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
				>
					<div class="flex items-center gap-3 mb-2">
						<div class="p-2 bg-red-500 rounded-lg">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
							</svg>
						</div>
						<h2 class="text-lg font-bold text-gray-900">Admin Users</h2>
					</div>
					<p class="text-xs text-gray-600">Manage admin user accounts and access levels</p>
				</a>
			{/if}

			<!-- Settings (Full Access Only) -->
			{#if hasAccess(ACCESS_LEVELS.FULL_ACCESS)}
				<a
					href="/admin/settings"
					class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 shadow-md border-2 border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
				>
					<div class="flex items-center gap-3 mb-2">
						<div class="p-2 bg-gray-500 rounded-lg">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
							</svg>
						</div>
						<h2 class="text-lg font-bold text-gray-900">Settings</h2>
					</div>
					<p class="text-xs text-gray-600">Contact & site settings</p>
				</a>
			{/if}
		</div>

		<!-- Dropdown Sections Row: Network & Media -->
		{#if !accessLevel || hasAccess(ACCESS_LEVELS.EDITOR_ACCESS)}
			<div class="grid md:grid-cols-2 gap-4">
				<!-- Network Section -->
				<div class="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3 shadow-md border-2 border-teal-200">
					<div class="flex items-center gap-2 mb-2">
						<div class="p-2 bg-teal-500 rounded-lg">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
							</svg>
						</div>
						<h2 class="text-lg font-bold text-gray-900">Network</h2>
					</div>
					<div class="grid grid-cols-3 gap-2">
						<a
							href="/admin/churches"
							class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-teal-300"
						>
							<div class="flex items-center gap-2 mb-1">
								<svg class="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
								</svg>
								<h3 class="text-sm font-semibold text-gray-900">Churches</h3>
							</div>
							<p class="text-xs text-gray-600">Network churches</p>
						</a>
						<a
							href="/admin/services"
							class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-teal-300"
						>
							<div class="flex items-center gap-2 mb-1">
								<svg class="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
								</svg>
								<h3 class="text-sm font-semibold text-gray-900">Training and Networking</h3>
							</div>
							<p class="text-xs text-gray-600">Training events</p>
						</a>
						<a
							href="/admin/events"
							class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-teal-300"
						>
							<div class="flex items-center gap-2 mb-1">
								<svg class="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
								</svg>
								<h3 class="text-sm font-semibold text-gray-900">Events</h3>
							</div>
							<p class="text-xs text-gray-600">Manage events</p>
						</a>
					</div>
				</div>

				<!-- Media Section -->
				<div class="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3 shadow-md border-2 border-pink-200">
					<div class="flex items-center gap-2 mb-2">
						<div class="p-2 bg-pink-500 rounded-lg">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
							</svg>
						</div>
						<h2 class="text-lg font-bold text-gray-900">Media</h2>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<a
							href="/admin/podcasts"
							class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-pink-300"
						>
							<div class="flex items-center gap-2 mb-1">
								<svg class="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
								</svg>
								<h3 class="text-sm font-semibold text-gray-900">Podcasts</h3>
							</div>
							<p class="text-xs text-gray-600">Messages & audio</p>
						</a>
						<a
							href="/admin/images"
							class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-pink-300"
						>
							<div class="flex items-center gap-2 mb-1">
								<svg class="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
								</svg>
								<h3 class="text-sm font-semibold text-gray-900">Images</h3>
							</div>
							<p class="text-xs text-gray-600">Upload & manage</p>
						</a>
					</div>
				</div>
			</div>
		{/if}

		<!-- Conferences Section (Hidden for Editor Access only) -->
		{#if (!accessLevel || (hasAccess(ACCESS_LEVELS.CONFERENCE_ACCESS) && accessLevel !== ACCESS_LEVELS.EDITOR_ACCESS))}
			{#if data.latestConferenceStats}
			<div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-md border-2 border-green-200">
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-3">
						<div class="p-3 bg-green-500 rounded-lg">
							<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
							</svg>
						</div>
						<div>
							<h2 class="text-xl font-bold text-gray-900">Conferences</h2>
							<p class="text-sm text-gray-600">Latest Conference: {data.latestConferenceStats.conference.title}</p>
						</div>
					</div>
					<a
						href="/admin/conferences"
						class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
					>
						View All
					</a>
				</div>

				<!-- Charts Row -->
				<div class="grid md:grid-cols-2 gap-6 mb-4">
					<!-- Age Groups Horizontal Bar Chart -->
					<div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
						<div class="text-center mb-6">
							<h3 class="text-lg font-bold text-gray-900 mb-1">Age Groups</h3>
							<div class="text-3xl font-bold text-gray-900 mt-2">{totalAttendees}</div>
							<div class="text-sm text-gray-600">Total Attendees</div>
						</div>
						<div class="space-y-4">
							<!-- Adults Bar -->
							<div>
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<div class="w-4 h-4 rounded bg-indigo-500"></div>
										<span class="text-sm font-semibold text-gray-900">Adults</span>
									</div>
									<span class="text-sm font-bold text-gray-900">{adultCount}</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
									<div 
										class="bg-indigo-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
										style="width: {totalAttendees > 0 ? (adultCount / totalAttendees) * 100 : 0}%"
									>
										{#if adultCount > 0 && totalAttendees > 0 && (adultCount / totalAttendees) * 100 > 10}
											<span class="text-xs font-semibold text-white">{Math.round((adultCount / totalAttendees) * 100)}%</span>
										{/if}
									</div>
								</div>
							</div>
							<!-- Teens Bar -->
							<div>
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<div class="w-4 h-4 rounded bg-purple-500"></div>
										<span class="text-sm font-semibold text-gray-900">Teens</span>
									</div>
									<span class="text-sm font-bold text-gray-900">{teenCount}</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
									<div 
										class="bg-purple-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
										style="width: {totalAttendees > 0 ? (teenCount / totalAttendees) * 100 : 0}%"
									>
										{#if teenCount > 0 && totalAttendees > 0 && (teenCount / totalAttendees) * 100 > 10}
											<span class="text-xs font-semibold text-white">{Math.round((teenCount / totalAttendees) * 100)}%</span>
										{/if}
									</div>
								</div>
							</div>
							<!-- Children Bar -->
							<div>
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<div class="w-4 h-4 rounded bg-yellow-500"></div>
										<span class="text-sm font-semibold text-gray-900">Kids</span>
									</div>
									<span class="text-sm font-bold text-gray-900">{childCount}</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
									<div 
										class="bg-yellow-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
										style="width: {totalAttendees > 0 ? (childCount / totalAttendees) * 100 : 0}%"
									>
										{#if childCount > 0 && totalAttendees > 0 && (childCount / totalAttendees) * 100 > 10}
											<span class="text-xs font-semibold text-white">{Math.round((childCount / totalAttendees) * 100)}%</span>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Camping Bar Chart -->
					<div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
						<div class="text-center mb-4">
							<h3 class="text-lg font-bold text-gray-900 mb-1">Accommodation</h3>
							<p class="text-xs text-gray-500">Camping vs Non-Camping</p>
						</div>
						<div class="flex items-end justify-center gap-8 h-40">
							<!-- Camping Bar -->
							<div class="flex flex-col items-center gap-2">
								<div class="relative w-20 bg-gray-200 rounded-t overflow-hidden" style="height: 120px;">
									<div class="absolute bottom-0 w-full bg-green-500 rounded-t transition-all duration-500" 
										style="height: {campingBarHeight}%">
									</div>
								</div>
								<div class="text-center">
									<div class="text-xl font-bold text-gray-900">{campingCount}</div>
									<div class="text-xs font-semibold text-green-700">Camping</div>
								</div>
							</div>
							<!-- Non-Camping Bar -->
							<div class="flex flex-col items-center gap-2">
								<div class="relative w-20 bg-gray-200 rounded-t overflow-hidden" style="height: 120px;">
									<div class="absolute bottom-0 w-full bg-orange-500 rounded-t transition-all duration-500" 
										style="height: {nonCampingBarHeight}%">
									</div>
								</div>
								<div class="text-center">
									<div class="text-xl font-bold text-gray-900">{nonCampingCount}</div>
									<div class="text-xs font-semibold text-orange-700">Non-Camping</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Real-Time Stats Row -->
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
					<!-- Today's Bookings -->
					<div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 shadow-sm border-2 border-indigo-200">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-2xl font-bold text-gray-900">{data.latestConferenceStats.todayBookings || 0}</div>
								<div class="text-xs text-gray-600 mt-1">Today's Bookings</div>
							</div>
							<svg class="w-8 h-8 text-indigo-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>
					</div>
					<!-- Today's Revenue -->
					<div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 shadow-sm border-2 border-green-200">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-2xl font-bold text-gray-900">{formatCurrency(data.latestConferenceStats.todayRevenue || 0)}</div>
								<div class="text-xs text-gray-600 mt-1">Today's Revenue</div>
							</div>
							<svg class="w-8 h-8 text-green-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>
					</div>
					<!-- Total Paid -->
					<div class="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 shadow-sm border-2 border-emerald-200">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-2xl font-bold text-gray-900">{formatCurrency(data.latestConferenceStats.totalPaid || 0)}</div>
								<div class="text-xs text-gray-600 mt-1">Total Received</div>
							</div>
							<svg class="w-8 h-8 text-emerald-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>
					</div>
					<!-- Outstanding -->
					<div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 shadow-sm border-2 border-orange-200">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-2xl font-bold text-gray-900">{formatCurrency(data.latestConferenceStats.totalOutstanding || 0)}</div>
								<div class="text-xs text-gray-600 mt-1">Outstanding</div>
							</div>
							<svg class="w-8 h-8 text-orange-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>
					</div>
				</div>

				<!-- Payment Status -->
				<div class="grid grid-cols-4 gap-3 mb-4">
					<!-- All Bookings -->
					<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-blue-500 rounded-full"></div>
							<div>
								<div class="text-xl font-bold text-gray-900">{data.latestConferenceStats.totalBookings}</div>
								<div class="text-xs text-gray-600">All Bookings</div>
							</div>
						</div>
					</div>
					<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-green-500 rounded-full"></div>
							<div>
								<div class="text-xl font-bold text-gray-900">{data.latestConferenceStats.paidBookings}</div>
								<div class="text-xs text-gray-600">Paid</div>
							</div>
						</div>
					</div>
					<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
							<div>
								<div class="text-xl font-bold text-gray-900">{data.latestConferenceStats.partialBookings}</div>
								<div class="text-xs text-gray-600">Partial</div>
							</div>
						</div>
					</div>
					<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-red-500 rounded-full"></div>
							<div>
								<div class="text-xl font-bold text-gray-900">{data.latestConferenceStats.unpaidBookings}</div>
								<div class="text-xs text-gray-600">Unpaid</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Recent Bookings -->
				{#if data.latestConferenceStats.recentBookings && data.latestConferenceStats.recentBookings.length > 0}
					<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
						<div class="flex items-center justify-between mb-3">
							<h3 class="text-lg font-bold text-gray-900">Recent Bookings</h3>
							<a href="/admin/conferences/bookings" class="text-sm text-green-600 hover:text-green-700 font-semibold">View All →</a>
						</div>
						<div class="space-y-2">
							{#each data.latestConferenceStats.recentBookings as booking}
								<a href="/admin/conferences/bookings?booking={booking.id}" class="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<span class="text-sm font-semibold text-gray-900">{booking.bookingReference}</span>
											<span class="px-2 py-0.5 rounded text-xs {
												booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
												booking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
												'bg-red-100 text-red-800'
											}">
												{booking.paymentStatus === 'paid' ? 'Paid' :
												 booking.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
											</span>
										</div>
										<div class="text-xs text-gray-600 mt-1">{booking.groupLeaderName}</div>
									</div>
									<div class="text-right">
										<div class="text-sm font-semibold text-gray-900">{formatCurrency(booking.totalAmount || 0)}</div>
										<div class="text-xs text-gray-500">{formatDate(booking.createdAt)}</div>
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Quick Links -->
				<div class="grid grid-cols-3 gap-3">
					<a
						href="/admin/conferences"
						class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-green-300"
					>
						<div class="flex items-center gap-2 mb-1">
							<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
							</svg>
							<h3 class="text-sm font-semibold text-gray-900">Conferences</h3>
						</div>
						<p class="text-xs text-gray-600">Manage conferences</p>
					</a>
					<a
						href="/admin/conferences/bookings"
						class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-green-300"
					>
						<div class="flex items-center gap-2 mb-1">
							<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
							</svg>
							<h3 class="text-sm font-semibold text-gray-900">Bookings</h3>
						</div>
						<p class="text-xs text-gray-600">View all bookings</p>
					</a>
					<a
						href="/admin/conferences/reports"
						class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-green-300"
					>
						<div class="flex items-center gap-2 mb-1">
							<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
							</svg>
							<h3 class="text-sm font-semibold text-gray-900">Reports</h3>
						</div>
						<p class="text-xs text-gray-600">View reports</p>
					</a>
				</div>

				<!-- Additional Links -->
				<div class="mt-4 pt-4 border-t border-green-200">
					<div class="flex gap-2">
						<a
							href="/admin/conferences/discount-codes"
							class="px-3 py-2 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							Discount Codes
						</a>
						{#if data.latestConferenceStats.conference.id}
							<a
								href="/admin/conferences/{data.latestConferenceStats.conference.id}/ticket-types"
								class="px-3 py-2 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
								</svg>
								Ticket Types
							</a>
						{/if}
					</div>
				</div>
			</div>
			{:else}
				<!-- Empty State -->
			<div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-md border-2 border-green-200">
				<div class="flex items-center gap-3 mb-4">
					<div class="p-3 bg-green-500 rounded-lg">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
						</svg>
					</div>
					<div>
						<h2 class="text-xl font-bold text-gray-900">Conferences</h2>
						<p class="text-sm text-gray-600">No conferences yet</p>
					</div>
				</div>
				<a
					href="/admin/conferences"
					class="inline-block px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
				>
					Create Your First Conference
				</a>
			</div>
			{/if}
		{/if}
	</div>
</div>


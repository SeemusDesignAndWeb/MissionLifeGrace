<script>
	import { onMount } from 'svelte';

	export let data;
	export let params = {};

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
	
	// Pie chart calculations for age groups
	$: adultPercent = totalAttendees > 0 ? (adultCount / totalAttendees) * 100 : 0;
	$: teenPercent = totalAttendees > 0 ? (teenCount / totalAttendees) * 100 : 0;
	$: childPercent = totalAttendees > 0 ? (childCount / totalAttendees) * 100 : 0;
	
	$: circumference = 2 * Math.PI * 50; // radius of 50 for larger pie chart
	$: adultDashArray = adultPercent > 0 ? (adultPercent / 100) * circumference : 0;
	$: teenDashArray = teenPercent > 0 ? (teenPercent / 100) * circumference : 0;
	$: childDashArray = childPercent > 0 ? (childPercent / 100) * circumference : 0;
	$: teenDashOffset = -adultDashArray;
	$: childDashOffset = -(adultDashArray + teenDashArray);
	
	// Bar chart calculations for camping
	$: maxCamping = Math.max(campingCount, nonCampingCount, 1);
	$: campingBarHeight = (campingCount / maxCamping) * 100;
	$: nonCampingBarHeight = (nonCampingCount / maxCamping) * 100;
</script>

<svelte:head>
	<title>Admin Dashboard - MLG</title>
</svelte:head>

<div class="container mx-auto px-4 py-4 mt-8">
	<div class="space-y-4">
		<!-- Individual Items Row: Pages, Team, Settings -->
		<div class="grid md:grid-cols-3 gap-3">
			<!-- Pages -->
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


			<!-- Settings -->
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
		</div>

		<!-- Dropdown Sections Row: Network & Media -->
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

		<!-- Conferences Section -->
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
					<!-- Age Groups Pie Chart -->
					<div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
						<div class="text-center mb-6">
							<h3 class="text-lg font-bold text-gray-900 mb-1">Age Groups</h3>
						</div>
						<div class="flex items-center justify-center gap-8">
							<!-- Total Amount (Left) -->
							<div class="flex flex-col items-center justify-center min-w-[100px]">
								<div class="text-5xl font-bold text-gray-900 mb-1">{totalAttendees}</div>
								<div class="text-sm font-semibold text-gray-600">Total</div>
								<div class="text-xs text-gray-500 mt-1">Attendees</div>
							</div>
							<!-- Pie Chart -->
							<div class="relative">
								<svg class="w-48 h-48 transform -rotate-90">
									<circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="12"/>
									{#if totalAttendees > 0}
										{#if adultCount > 0}
											<circle cx="60" cy="60" r="50" fill="none" stroke="#4f46e5" stroke-width="12" 
												stroke-dasharray="{adultDashArray} {circumference}" 
												stroke-dashoffset="0" stroke-linecap="round"/>
										{/if}
										{#if teenCount > 0}
											<circle cx="60" cy="60" r="50" fill="none" stroke="#a855f7" stroke-width="12" 
												stroke-dasharray="{teenDashArray} {circumference}" 
												stroke-dashoffset="{teenDashOffset}" stroke-linecap="round"/>
										{/if}
										{#if childCount > 0}
											<circle cx="60" cy="60" r="50" fill="none" stroke="#eab308" stroke-width="12" 
												stroke-dasharray="{childDashArray} {circumference}" 
												stroke-dashoffset="{childDashOffset}" stroke-linecap="round"/>
										{/if}
									{/if}
								</svg>
							</div>
							<!-- Legend -->
							<div class="space-y-4 min-w-[120px]">
								<div class="flex items-center gap-3">
									<div class="w-5 h-5 rounded-full bg-indigo-500 shadow-sm"></div>
									<div class="flex-1">
										<div class="text-lg font-bold text-gray-900">{adultCount}</div>
										<div class="text-xs text-gray-600">Adults</div>
									</div>
								</div>
								<div class="flex items-center gap-3">
									<div class="w-5 h-5 rounded-full bg-purple-500 shadow-sm"></div>
									<div class="flex-1">
										<div class="text-lg font-bold text-gray-900">{teenCount}</div>
										<div class="text-xs text-gray-600">Teens</div>
									</div>
								</div>
								<div class="flex items-center gap-3">
									<div class="w-5 h-5 rounded-full bg-yellow-500 shadow-sm"></div>
									<div class="flex-1">
										<div class="text-lg font-bold text-gray-900">{childCount}</div>
										<div class="text-xs text-gray-600">Kids</div>
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

				<!-- Payment Status -->
				<div class="grid grid-cols-4 gap-3 mb-4">
					<!-- All Bookings -->
					<div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 shadow-sm border-2 border-blue-200">
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
	</div>
</div>


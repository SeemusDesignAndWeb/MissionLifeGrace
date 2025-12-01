<script lang="js">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import HelpSystem from '$lib/components/HelpSystem.svelte';

	export let data;
	export let params = {};

	let openDropdown = null;
	let openSubmenu = null;
	let mobileMenuOpen = false;

	function handleLogout() {
		fetch('/admin/logout', { method: 'POST' }).then(() => {
			goto('/admin/login');
		});
	}

	// Don't show navbar on login page
	$: showNavbar = $page.url.pathname !== '/admin/login';

	// Close dropdowns when clicking outside
	onMount(() => {
		function handleClickOutside(event) {
			if (!event.target.closest('.dropdown-container') && !event.target.closest('.submenu-container')) {
				openDropdown = null;
				openSubmenu = null;
			}
		}
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	function toggleDropdown(dropdownId) {
		openDropdown = openDropdown === dropdownId ? null : dropdownId;
		openSubmenu = null; // Close submenu when opening/closing main dropdown
	}

	function toggleSubmenu(itemId) {
		openSubmenu = openSubmenu === itemId ? null : itemId;
	}

	$: currentPath = $page.url.pathname;

	function isActive(href) {
		const path = currentPath;
		if (href === '/admin') {
			return path === '/admin';
		}
		// Exact match
		if (path === href) {
			return true;
		}
		// Path starts with href followed by / (for sub-pages)
		return path.startsWith(href + '/');
	}

	function isDropdownActive(items) {
		// Only return true if at least one item in the dropdown is actually active
		const path = currentPath;
		return items.some(item => {
			const href = item.href;
			if (href === '/admin') {
				return path === '/admin';
			}
			// Exact match
			if (path === href) {
				return true;
			}
			// Path starts with href followed by / (for sub-pages)
			return path.startsWith(href + '/');
		});
	}

	// Access level constants
	const ACCESS_LEVELS = {
		FULL_ACCESS: 'full_access',
		EDITOR_ACCESS: 'editor_access',
		CONFERENCE_ACCESS: 'conference_access'
	};

	// Get access level from data
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

	// Navigation structure with dropdowns
	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', accessLevel: null }
	];

		const dropdownMenus = [
		{
			id: 'content',
			label: 'Content',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			accessLevel: ACCESS_LEVELS.EDITOR_ACCESS,
			items: [
				{ href: '/admin/pages', label: 'Pages', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', accessLevel: ACCESS_LEVELS.EDITOR_ACCESS },
				{ href: '/admin/policies', label: 'Policies', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', accessLevel: ACCESS_LEVELS.EDITOR_ACCESS }
			]
		},
		{
			id: 'network',
			label: 'Network',
			icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
			accessLevel: ACCESS_LEVELS.EDITOR_ACCESS,
			items: [
				{ href: '/admin/team', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', accessLevel: ACCESS_LEVELS.EDITOR_ACCESS },
				{ href: '/admin/churches', label: 'Churches', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', accessLevel: ACCESS_LEVELS.EDITOR_ACCESS },
				{ href: '/admin/services', label: 'Training and Networking', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', accessLevel: ACCESS_LEVELS.EDITOR_ACCESS },
				{ href: '/admin/events', label: 'Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', accessLevel: ACCESS_LEVELS.EDITOR_ACCESS }
			]
		},
		{
			id: 'media',
			label: 'Media',
			icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
			accessLevel: ACCESS_LEVELS.EDITOR_ACCESS,
			items: [
				{ href: '/admin/podcasts', label: 'Podcasts', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3', accessLevel: ACCESS_LEVELS.EDITOR_ACCESS },
				{ href: '/admin/images', label: 'Images', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', accessLevel: ACCESS_LEVELS.EDITOR_ACCESS }
			]
		},
		{
			id: 'conferences',
			label: 'Conferences',
			icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
			accessLevel: ACCESS_LEVELS.CONFERENCE_ACCESS,
			items: [
				{ href: '/admin/conferences', label: 'All Conferences', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', accessLevel: ACCESS_LEVELS.CONFERENCE_ACCESS },
				{ href: '/admin/conferences/bookings', label: 'Bookings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', accessLevel: ACCESS_LEVELS.CONFERENCE_ACCESS },
				{ href: '/admin/conferences/discount-codes', label: 'Discount Codes', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', accessLevel: ACCESS_LEVELS.CONFERENCE_ACCESS },
				{ href: '/admin/conferences/form-fields', label: 'Form Fields', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', accessLevel: ACCESS_LEVELS.CONFERENCE_ACCESS },
				{ href: '/admin/conferences/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', accessLevel: ACCESS_LEVELS.CONFERENCE_ACCESS }
			]
		},
		{
			id: 'settings',
			label: 'Settings',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
			accessLevel: ACCESS_LEVELS.FULL_ACCESS,
			items: [
				{ href: '/admin/settings', label: 'Site Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', accessLevel: ACCESS_LEVELS.FULL_ACCESS },
				{ href: '/admin/users', label: 'Admin Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', accessLevel: ACCESS_LEVELS.FULL_ACCESS }
			]
		}
	];

	const standaloneItems = [];
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Admin Navbar -->
	{#if showNavbar}
		<nav class="bg-primary shadow-lg border-b border-primary-dark">
		<div class="container mx-auto px-4">
			<div class="flex items-center justify-between h-16">
				<!-- Logo/Brand -->
				<div class="flex items-center gap-4">
					<a href="/admin" class="flex items-center gap-2">
						<img
							src="/images/mlg-logo.svg"
							alt="Mission Life Grace"
							class="h-8 w-auto brightness-0 invert"
						/>
						<span class="text-xl font-bold text-white">Admin</span>
					</a>
				</div>

				<!-- Navigation Links -->
				<div class="hidden md:flex items-center gap-1">
					<!-- Dashboard -->
					{#each navItems as item}
						{#if !item.accessLevel || hasAccess(item.accessLevel)}
							<a
								href={item.href}
								class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white hover:bg-white/20 hover:text-white {isActive(item.href) ? 'bg-white/20' : ''}"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={item.icon}
									></path>
								</svg>
								{item.label}
							</a>
						{/if}
					{/each}

					<!-- Dropdown Menus -->
					{#each dropdownMenus as menu}
						{#if menu.id === 'conferences'}
							{#if accessLevel === ACCESS_LEVELS.CONFERENCE_ACCESS || accessLevel === ACCESS_LEVELS.FULL_ACCESS}
								<div class="dropdown-container relative">
									<button
										on:click={() => toggleDropdown(menu.id)}
										class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white hover:bg-white/20 hover:text-white {isDropdownActive(menu.items) ? 'bg-white/20' : ''}"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d={menu.icon}
											></path>
										</svg>
										{menu.label}
										<svg
											class="w-4 h-4 transition-transform {openDropdown === menu.id ? 'rotate-180' : ''}"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											></path>
										</svg>
									</button>
									{#if openDropdown === menu.id}
										<div class="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
											{#each menu.items as item}
												{#if !item.accessLevel || hasAccess(item.accessLevel)}
													<a
														href={item.href}
														on:click={() => { openDropdown = null; }}
														class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 {isActive(item.href) ? 'bg-gray-100' : ''}"
													>
														<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d={item.icon}
															></path>
														</svg>
														{item.label}
													</a>
												{/if}
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						{:else if hasAccess(menu.accessLevel)}
							<div class="dropdown-container relative">
								<button
									on:click={() => toggleDropdown(menu.id)}
									class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white hover:bg-white/20 hover:text-white {isDropdownActive(menu.items) ? 'bg-white/20' : ''}"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={menu.icon}
										></path>
									</svg>
									{menu.label}
									<svg
										class="w-4 h-4 transition-transform {openDropdown === menu.id ? 'rotate-180' : ''}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										></path>
									</svg>
								</button>
								{#if openDropdown === menu.id}
									<div class="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
										{#each menu.items as item}
											{#if !item.accessLevel || hasAccess(item.accessLevel)}
												<a
													href={item.href}
													on:click={() => { openDropdown = null; }}
													class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 {isActive(item.href) ? 'bg-gray-100' : ''}"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d={item.icon}
														></path>
													</svg>
													{item.label}
												</a>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					{/each}

					<!-- Standalone Items -->
					{#each standaloneItems as item}
						{#if hasAccess(item.accessLevel)}
							<a
								href={item.href}
								class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white hover:bg-white/20 hover:text-white {isActive(item.href) ? 'bg-white/20' : ''}"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={item.icon}
									></path>
								</svg>
								{item.label}
							</a>
						{/if}
					{/each}
				</div>

				<!-- Logout Button -->
				<button
					on:click={handleLogout}
					class="px-4 py-2 bg-white text-primary rounded-full hover:bg-orange-500 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						></path>
					</svg>
					Logout
				</button>
			</div>

			<!-- Mobile Menu Button -->
			<button
				on:click={() => mobileMenuOpen = !mobileMenuOpen}
				class="md:hidden px-3 py-2 rounded-lg text-white hover:bg-white/20 hover:text-white"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
					></path>
				</svg>
			</button>

				<!-- Mobile Navigation -->
			{#if mobileMenuOpen}
				<div class="md:hidden pb-4 border-t border-primary-dark mt-4 pt-4">
					<!-- Dashboard -->
					{#each navItems as item}
						{#if !item.accessLevel || hasAccess(item.accessLevel)}
							<a
								href={item.href}
								on:click={() => mobileMenuOpen = false}
								class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mb-1 text-white hover:bg-white/20 hover:text-white {isActive(item.href) ? 'bg-white/20' : ''}"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={item.icon}
									></path>
								</svg>
								{item.label}
							</a>
						{/if}
					{/each}

					<!-- Dropdown Menus -->
					{#each dropdownMenus as menu}
						{#if menu.id === 'conferences'}
							{#if accessLevel === ACCESS_LEVELS.CONFERENCE_ACCESS || accessLevel === ACCESS_LEVELS.FULL_ACCESS}
								<div class="mb-2">
									<button
										on:click={() => toggleDropdown(menu.id)}
										class="w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between text-white hover:bg-white/20 hover:text-white"
									>
									<div class="flex items-center gap-2">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d={menu.icon}
											></path>
										</svg>
										{menu.label}
									</div>
									<svg
										class="w-4 h-4 transition-transform {openDropdown === menu.id ? 'rotate-180' : ''}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										></path>
									</svg>
								</button>
								{#if openDropdown === menu.id}
									<div class="ml-4 mt-1 space-y-1">
										{#each menu.items as item}
											{#if !item.accessLevel || hasAccess(item.accessLevel)}
												<a
													href={item.href}
													on:click={() => { openDropdown = null; mobileMenuOpen = false; }}
													class="block px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 bg-gray-50 text-gray-700 hover:bg-gray-100"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d={item.icon}
														></path>
													</svg>
													{item.label}
												</a>
											{/if}
										{/each}
									</div>
								{/if}
								</div>
							{/if}
						{:else if hasAccess(menu.accessLevel)}
							<div class="mb-2">
								<button
									on:click={() => toggleDropdown(menu.id)}
									class="w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between text-white hover:bg-white/20 hover:text-white"
								>
								<div class="flex items-center gap-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={menu.icon}
										></path>
									</svg>
									{menu.label}
								</div>
								<svg
									class="w-4 h-4 transition-transform {openDropdown === menu.id ? 'rotate-180' : ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									></path>
								</svg>
							</button>
							{#if openDropdown === menu.id}
								<div class="ml-4 mt-1 space-y-1">
									{#each menu.items as item}
										{#if !item.accessLevel || hasAccess(item.accessLevel)}
											<a
												href={item.href}
												on:click={() => { openDropdown = null; mobileMenuOpen = false; }}
												class="block px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 bg-gray-50 text-gray-700 hover:bg-gray-100"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d={item.icon}
													></path>
												</svg>
												{item.label}
											</a>
										{/if}
									{/each}
								</div>
							{/if}
							</div>
						{/if}
					{/each}

					<!-- Standalone Items -->
					{#each standaloneItems as item}
						{#if hasAccess(item.accessLevel)}
							<a
								href={item.href}
								on:click={() => mobileMenuOpen = false}
								class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mb-1 text-white hover:bg-white/20 hover:text-white {isActive(item.href) ? 'bg-white/20' : ''}"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={item.icon}
									></path>
								</svg>
								{item.label}
							</a>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
		</nav>
	{/if}

	<!-- Page Content -->
	<main>
		<slot />
	</main>
	
	<!-- Help System (floating help button and support form) - Admin only -->
	<HelpSystem />
</div>

<style>
	:global(.admin-page) {
		min-height: calc(100vh - 4rem);
	}
</style>


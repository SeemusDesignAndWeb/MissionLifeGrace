<script lang="js">
	export let conferences = [];

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { 
			day: 'numeric', 
			month: 'short', 
			year: 'numeric' 
		});
	}

	function formatDateRange(startDate, endDate) {
		if (!startDate) return '';
		if (!endDate || startDate === endDate) {
			return formatDate(startDate);
		}
		const start = new Date(startDate);
		const end = new Date(endDate);
		if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
			return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
		}
		return `${formatDate(startDate)} - ${formatDate(endDate)}`;
	}

	function getConferenceInfo(conference) {
		const parts = [];
		if (conference.startDate) {
			parts.push(formatDateRange(conference.startDate, conference.endDate));
		}
		if (conference.venue && conference.venue.name) {
			parts.push(conference.venue.name);
		}
		return parts.join(' • ');
	}

	function getImageUrl(conference) {
		if (conference.images && conference.images.length > 0) {
			return conference.images[0];
		}
		return null;
	}

	function getDescriptionExcerpt(description) {
		if (!description) return '';
		// Remove heading tags (h1-h6) and their content
		let text = description.replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi, '');
		// Strip remaining HTML tags
		text = text.replace(/<[^>]*>/g, '');
		// Replace multiple whitespace (spaces, newlines, tabs) with single space
		text = text.replace(/\s+/g, ' ').trim();
		// If text doesn't end with punctuation and is being truncated, add ellipsis
		if (text.length > 150) {
			text = text.substring(0, 150);
			// Find the last space before the limit to avoid cutting words
			const lastSpace = text.lastIndexOf(' ');
			if (lastSpace > 100) {
				text = text.substring(0, lastSpace);
			}
			// Ensure proper punctuation before ellipsis
			if (!text.match(/[.!?]$/)) {
				text = text.replace(/[,;:]$/, '.');
			}
			return text + '...';
		}
		return text;
	}
</script>

{#if conferences && conferences.length > 0}
	<section class="py-20 bg-white">
		<div class="container mx-auto px-4">
			<div class="text-center mb-12">
				<span class="text-primary text-sm font-semibold uppercase tracking-wider mb-2 block">Join Us</span>
				<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
					Upcoming Conferences
				</h2>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					Book now for our inspiring conferences and gatherings
				</p>
			</div>

			<div class="max-w-5xl mx-auto">
				{#each conferences as conference, index}
					<a
						href="/conference/{conference.slug}"
						class="group block mb-8 last:mb-0"
					>
						<div class="bg-gradient-to-r from-primary/5 via-white to-primary/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/30">
							<div class="md:flex">
								<!-- Image Section -->
								<div class="md:w-2/5 relative overflow-hidden">
									<div class="aspect-video md:aspect-auto md:h-full">
										{#if getImageUrl(conference)}
											<img
												src={getImageUrl(conference)}
												alt={conference.title}
												class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
											/>
										{:else}
											<div class="w-full h-full bg-gradient-to-br from-primary/20 to-brand-blue/10 flex items-center justify-center">
												<svg class="w-20 h-20 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
											</div>
										{/if}
									</div>
									{#if conference.registrationOpen}
										<div class="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg">
											Booking Open
										</div>
									{/if}
									<!-- Overlay on hover -->
									<div class="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
										<div class="text-white text-center">
											<span class="text-xl font-bold">Book Now →</span>
										</div>
									</div>
								</div>
								
								<!-- Content Section -->
								<div class="md:w-3/5 p-8 flex flex-col justify-center">
									<h3 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
										{conference.title}
									</h3>
									{#if getConferenceInfo(conference)}
										<div class="flex items-center gap-2 text-primary font-semibold text-sm mb-4">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
											<span>{getConferenceInfo(conference)}</span>
										</div>
									{/if}
									{#if conference.description}
										<div class="text-gray-600 leading-relaxed mb-4 line-clamp-3">
											{getDescriptionExcerpt(conference.description)}
										</div>
									{/if}
									<div class="flex items-center gap-2 text-primary font-semibold mt-auto">
										<span>Learn More & Book</span>
										<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
										</svg>
									</div>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>

			{#if conferences.length >= 3}
				<div class="text-center mt-12">
					<a
						href="/conferences"
						class="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-all transform hover:scale-105 shadow-lg"
					>
						<span>View All Conferences</span>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</a>
				</div>
			{/if}
		</div>
	</section>
{/if}



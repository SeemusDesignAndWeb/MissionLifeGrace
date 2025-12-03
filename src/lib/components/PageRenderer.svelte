<script lang="js">
	import { onMount, getContext } from 'svelte';
	import Contact from './Contact.svelte';
	import Gallery from './Gallery.svelte';

	export let page;
	export let contactInfo = {
		address: '542 Westhorne Avenue, Eltham, London, SE9 6RR',
		phone: '020 8850 1331',
		email: 'enquiries@egcc.co.uk'
	};


	function getBackgroundClass(bg) {
		switch (bg) {
			case 'white':
				return 'bg-white';
			case 'gray-50':
				return 'bg-gray-50';
			case 'gray-100':
				return 'bg-gray-100';
			case 'gray-800':
				return 'bg-gray-800';
			case 'primary':
				return 'bg-primary';
			default:
				return 'bg-white';
		}
	}

	function getTextColorClass(textColor) {
		return textColor === 'light' ? 'text-white' : 'text-dark-gray';
	}

	function getPaddingClass(padding) {
		switch (padding) {
			case 'none':
				return '';
			case 'small':
				return 'py-10';
			case 'medium':
				return 'py-16';
			case 'large':
				return 'py-20';
			default:
				return 'py-20';
		}
	}

	function getMaxWidthClass(maxWidth) {
		switch (maxWidth) {
			case 'sm':
				return 'max-w-sm';
			case 'md':
				return 'max-w-md';
			case 'lg':
				return 'max-w-lg';
			case 'xl':
				return 'max-w-xl';
			case '2xl':
				return 'max-w-2xl';
			case '4xl':
				return 'max-w-4xl';
			case 'full':
				return 'max-w-full';
			default:
				return 'max-w-4xl';
		}
	}

	function getAlignmentClass(alignment) {
		switch (alignment) {
			case 'left':
				return 'text-left';
			case 'right':
				return 'text-right';
			case 'center':
				return 'text-center';
			default:
				return 'text-left';
		}
	}

	function renderCTA(cta) {
		if (!cta) return null;

		const buttons = Array.isArray(cta) ? cta : [cta];

		return buttons.map((button) => {
			const styleClass =
				button.style === 'secondary'
					? 'bg-gray-600 text-white'
					: button.style === 'outline'
						? 'border-2 border-primary text-primary bg-transparent'
						: 'bg-primary text-white';

			return {
				...button,
				styleClass
			};
		});
	}
</script>

<!-- Hero section removed - pages now use HeroSlides component -->

<!-- Page Sections -->
{#if page.sections}
	{#each page.sections as section, sectionIndex}
		{@const bgClass = getBackgroundClass(section.backgroundColor)}
		{@const textClass = getTextColorClass(section.textColor)}
		{@const paddingClass = getPaddingClass(section.padding)}
		{@const maxWidthClass = getMaxWidthClass(section.maxWidth)}
		{@const alignmentClass = getAlignmentClass(section.alignment)}
		{@const isLastSection = page.id === 'churches' && sectionIndex === page.sections.length - 1}
		{@const isChurchesLastText = isLastSection && section.type === 'text'}

		{#if section.type === 'contact'}
			{#if section.showForm}
				<Contact contactInfo={contactInfo} />
			{/if}
		{:else}
			{@const isChurchesIntro = page.id === 'churches' && section.id === 'intro-section'}
			{@const isChurchesGrid = page.id === 'churches' && section.id === 'churches-grid'}
			<section class="{isChurchesGrid ? 'bg-white' : bgClass} {isChurchesIntro ? '' : paddingClass} {isChurchesGrid ? 'py-4' : ''} {textClass} {isChurchesIntro ? 'relative overflow-hidden' : ''}">
				{#if isChurchesIntro}
					<!-- Special design for churches intro section - Home page style -->
					<section class="py-20 bg-gradient-to-b from-white to-gray-50">
						<div class="container mx-auto px-4">
							<div class="max-w-6xl mx-auto">
								<div class="grid md:grid-cols-2 gap-12 items-center">
									<div class="order-2 md:order-1">
										{#if section.label}
											<div class="inline-block mb-4">
												<span class="text-primary text-sm font-semibold uppercase tracking-wider">{@html section.label}</span>
											</div>
										{/if}
										{#if section.title}
											<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
												{@html section.title}
											</h2>
										{/if}
										
										{#if section.content}
											<div class="space-y-4 text-gray-700 leading-relaxed prose prose-lg max-w-none">
												{@html section.content}
											</div>
										{/if}
									</div>

									{#if section.image}
										<div class="order-1 md:order-2 flex justify-center md:justify-end">
											<div class="relative w-full max-w-lg flex justify-center md:justify-end">
												<div class="relative">
													<!-- Circular decorative shape behind - same size as image, offset -->
													<div class="absolute w-80 h-80 md:w-96 md:h-96 bg-primary/20 rounded-full -top-2 -right-2 md:-top-3 md:-right-3"></div>
													<!-- Circular image -->
													<img
														src={section.image}
														alt="Churches"
														class="relative rounded-full shadow-2xl w-80 h-80 md:w-96 md:h-96 object-cover z-10"
													/>
												</div>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</section>
				{:else if isChurchesLastText}
					<!-- Vision-style design for last section on churches page -->
					<section class="relative py-12 md:py-16 overflow-hidden">
						<!-- Gradient Background -->
						<div class="absolute inset-0 bg-gradient-to-br from-primary via-brand-blue to-brand-cyan opacity-95"></div>
						
						<!-- Decorative Elements -->
						<div class="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
						<div class="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2"></div>
						<div class="absolute top-1/2 left-1/4 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
						<div class="absolute top-1/4 right-1/4 w-32 h-32 bg-white/5 rounded-full"></div>
						
						<!-- Content -->
						<div class="container mx-auto px-4 relative z-10">
							<div class="max-w-3xl mx-auto text-center">
								<!-- Label -->
								{#if section.label}
									<div class="mb-4">
										<span class="inline-block px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider rounded-full">
											{@html section.label}
										</span>
									</div>
								{/if}
								
								<!-- Title -->
								{#if section.title}
									<h2 class="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
										{@html section.title}
									</h2>
								{/if}
								
								<!-- Content in glassmorphic card -->
								{#if section.content}
									<div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-white/20">
										<div class="text-lg md:text-xl text-white !text-white leading-relaxed font-light [&_*]:text-white [&_p]:text-lg [&_p]:md:text-xl [&_p]:text-white">
											{@html section.content}
										</div>
									</div>
								{/if}
								
								<!-- Contact Button -->
								<div class="mt-8">
									<a
										href="/#contact"
										class="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-full font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
									>
										<span>Get in touch</span>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
										</svg>
									</a>
								</div>
								
								<!-- Decorative Quote Marks -->
								<div class="mt-6 flex justify-center items-center gap-4">
									<svg class="w-8 h-8 text-white/30" fill="currentColor" viewBox="0 0 24 24">
										<path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
									</svg>
								</div>
							</div>
						</div>
					</section>
				{:else}
					<!-- Standard text section design -->
					<div class="container mx-auto px-4">
						<div class="{maxWidthClass} mx-auto {alignmentClass} space-y-6">
							{#if section.type === 'text'}
								{#if section.title}
									<h2 class="text-4xl font-bold mb-8">{@html section.title}</h2>
								{/if}
								{#if section.content}
									<div class="prose prose-lg mx-auto text-light-gray">{@html section.content}</div>
								{/if}
								{#if section.cta}
									<div class="mt-8 {alignmentClass === 'text-center' ? 'text-center' : ''}">
										{#each renderCTA(section.cta) as button}
											<a
												href={button.link}
												target={button.target || '_self'}
												class="inline-block {button.styleClass} px-8 py-3 rounded hover:bg-opacity-90 transition-colors mr-4 mb-4"
											>
												{button.text}
											</a>
										{/each}
									</div>
								{/if}
							{:else if section.type === 'welcome'}
							<div class="grid md:grid-cols-3 gap-12 items-center">
							{#if section.image}
								<div class="md:col-span-1 flex justify-center">
									<img
										src={section.image}
										alt={section.imageAlt || section.title || 'Welcome'}
										class="w-full {section.imageWidth ? section.imageWidth : 'max-w-xs'} h-auto rounded-lg"
									/>
								</div>
							{/if}
							<div class="md:col-span-2">
								{#if section.title}
									<h2 class="text-4xl font-bold mb-6">{@html section.title}</h2>
								{/if}
								{#if section.content}
									<div class="space-y-4 text-light-gray leading-relaxed">{@html section.content}</div>
								{/if}
								{#if section.signature}
									<div class="mt-6">
										<img
											src={section.signature}
											alt="Signature"
											class="h-16 w-auto"
										/>
									</div>
								{/if}
							</div>
						</div>

							{:else if section.type === 'columns'}
						{@const colCount = section.columnCount || (section.columns?.length || 3)}
						{@const gridClass =
							colCount === 2
								? 'md:grid-cols-2'
								: colCount === 4
									? 'md:grid-cols-4'
									: 'md:grid-cols-3'}
						{@const isChurchesPage = section.id === 'churches-grid'}
						{#if isChurchesPage}
							<!-- Horizontal scrolling churches - logo on top, text below, single row -->
							{#if section.columns && section.columns.length > 0}
								<div class="py-4 overflow-hidden">
									<!-- Single Row - Scrolls left to right -->
									<div class="relative">
										<div class="overflow-hidden">
											<div class="flex animate-scroll-left gap-6 md:gap-8" style="animation-duration: 40s;">
												{#each section.columns as column, index}
													{@const churchLink = column.link || column.content.match(/href="([^"]*)"/)?.[1] || '#'}
													<a 
														href={churchLink} 
														target="_blank" 
														rel="noopener noreferrer" 
														class="group flex-shrink-0 w-48 md:w-64 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col p-6 border-2 border-transparent hover:border-primary/30"
													>
														<!-- Logo at top -->
														<div class="flex items-center justify-center h-32 md:h-40 mb-4 bg-gray-50 rounded-lg p-4">
															{#if column.image}
																<img
																	src={column.image}
																	alt={column.title || 'Church logo'}
																	class="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-110"
																/>
															{:else}
																<div class="text-gray-400 text-sm font-medium">No logo</div>
															{/if}
														</div>
														
														<!-- Text below -->
														<div class="flex-1 flex flex-col justify-center text-center">
															{#if column.title}
																<h3 class="text-base md:text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
																	{@html column.title}
																</h3>
															{/if}
															{#if column.content && column.content.includes('href=')}
																<span class="text-xs md:text-sm text-primary font-medium inline-flex items-center gap-1 mt-2">
																	Visit
																	<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
																	</svg>
																</span>
															{/if}
														</div>
													</a>
												{/each}
											</div>
										</div>
									</div>
								</div>
								
								<!-- Add CSS animation for smooth infinite scrolling -->
								<style>
									@keyframes scroll-left {
										0% {
											transform: translateX(0);
										}
										100% {
											transform: translateX(-100%);
										}
									}
									
									.animate-scroll-left {
										animation: scroll-left linear infinite;
										will-change: transform;
									}
									
									/* Pause on hover for better UX */
									.animate-scroll-left:hover {
										animation-play-state: paused;
									}
								</style>
							{/if}
						{:else}
							<!-- Standard columns layout for other pages -->
							<div class="grid {gridClass} gap-8 lg:gap-10">
								{#if section.columns}
									{#each section.columns as column, index}
										<div class="bg-white rounded-lg shadow-lg p-6">
											{#if column.title}
												<h3 class="text-xl font-bold text-gray-900 mb-4">{@html column.title}</h3>
											{/if}
											{#if column.content}
												<div class="text-gray-600">{@html column.content}</div>
											{/if}
										</div>
									{/each}
								{/if}
							</div>
						{/if}

							{:else if section.type === 'image'}
						{@const imagePos = section.imagePosition || 'left'}
						{@const isLeft = imagePos === 'left'}
						{@const isRight = imagePos === 'right'}
						{@const isCenter = imagePos === 'center'}
						{@const isTop = imagePos === 'top'}
						{@const isBottom = imagePos === 'bottom'}

						{#if isCenter || isTop || isBottom}
							<div class="space-y-8">
								{#if section.image && (isTop || isCenter)}
									<div class="flex justify-center">
										<img
											src={section.image}
											alt={section.imageAlt || section.title || 'Image'}
											class="{section.imageWidth || 'w-full'} h-auto rounded-lg"
										/>
									</div>
								{/if}
								{#if section.title}
									<h3 class="text-2xl font-bold mb-4">{@html section.title}</h3>
								{/if}
								{#if section.content}
									<div class="text-light-gray leading-relaxed">{@html section.content}</div>
								{/if}
								{#if section.image && isBottom}
									<div class="flex justify-center">
										<img
											src={section.image}
											alt={section.imageAlt || section.title || 'Image'}
											class="{section.imageWidth || 'w-full'} h-auto rounded-lg"
										/>
									</div>
								{/if}
							</div>
						{:else}
							<div class="flex flex-col {isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} gap-6 items-center">
								{#if section.image}
									<div class="flex-shrink-0">
										<img
											src={section.image}
											alt={section.imageAlt || section.title || 'Image'}
											class="{section.imageWidth || 'w-48'} h-auto"
										/>
									</div>
								{/if}
								<div class="flex-1">
									{#if section.title}
										<h3 class="text-2xl font-bold mb-4">{@html section.title}</h3>
									{/if}
									{#if section.content}
										<div class="text-light-gray leading-relaxed">{@html section.content}</div>
									{/if}
								</div>
							</div>
						{/if}

							{:else if section.type === 'cta'}
						<div class="text-center">
							{#if section.title}
								<h2 class="text-4xl font-bold mb-8">{@html section.title}</h2>
							{/if}
							{#if section.content}
								<div class="mb-8">{@html section.content}</div>
							{/if}
							{#if section.cta}
								{#each renderCTA(section.cta) as button}
									<a
										href={button.link}
										target={button.target || '_self'}
										class="inline-block {button.styleClass} px-8 py-3 rounded hover:bg-opacity-90 transition-colors mr-4 mb-4"
									>
										{button.text}
									</a>
								{/each}
							{/if}
						</div>

							{:else if section.type === 'gallery'}
						<Gallery
							images={section.images || []}
							columns={section.columns || 3}
							gap={section.gap || 'gap-4'}
							title={section.title || ''}
							startFullscreenSlideshow={section.startFullscreenSlideshow || false}
							slideshowInterval={section.slideshowInterval || 4000}
						/>

							{:else if section.type === 'values'}
						<div class="text-center mb-16">
							{#if section.title}
								<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
									{@html section.title}
								</h2>
							{/if}
							{#if section.description}
								<p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
									{@html section.description}
								</p>
							{/if}
						</div>
						{#if section.values && section.values.length > 0}
							<div class="grid md:grid-cols-2 gap-8 lg:gap-10">
								{#each section.values as value, index}
									{@const colorClasses = [
										{ bg: 'bg-primary/10', border: 'border-primary', title: 'text-primary', accent: 'bg-primary' },
										{ bg: 'bg-brand-blue/10', border: 'border-brand-blue', title: 'text-brand-blue', accent: 'bg-brand-blue' },
										{ bg: 'bg-primary/10', border: 'border-primary', title: 'text-primary', accent: 'bg-primary' },
										{ bg: 'bg-brand-blue/10', border: 'border-brand-blue', title: 'text-brand-blue', accent: 'bg-brand-blue' },
										{ bg: 'bg-primary/10', border: 'border-primary', title: 'text-primary', accent: 'bg-primary' },
										{ bg: 'bg-brand-blue/10', border: 'border-brand-blue', title: 'text-brand-blue', accent: 'bg-brand-blue' },
										{ bg: 'bg-primary/10', border: 'border-primary', title: 'text-primary', accent: 'bg-primary' }
									]}
									{@const colors = colorClasses[index % colorClasses.length]}
									<div class="group relative bg-white rounded-lg p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 {colors.border} transform hover:-translate-y-2 overflow-hidden">
										<!-- Decorative circle accent -->
										<div class="absolute -top-8 -right-8 w-24 h-24 {colors.accent}/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-300"></div>
										
										<div class="relative z-10">
											{#if value.title}
												<h3 class="text-2xl lg:text-3xl font-bold {colors.title} mb-5 leading-tight">
													{@html value.title}
												</h3>
											{/if}
											{#if value.description}
												<div class="text-gray-700 leading-relaxed text-base lg:text-lg">
													{@html value.description}
												</div>
											{:else}
												<div class="text-gray-400 italic">Description coming soon...</div>
											{/if}
										</div>
										
										<!-- Bottom accent line -->
										<div class="absolute bottom-0 left-0 right-0 h-1 {colors.accent} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
						</div>
					</div>
				{/if}
			</section>
		{/if}
	{/each}
{/if}


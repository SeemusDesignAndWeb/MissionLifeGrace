<script>
	export let home = null;
</script>

{#if home && home.visionText}
	<section id="vision" class="relative py-12 md:py-16 overflow-hidden">
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
				{#if home.visionLabel}
					<div class="mb-4">
						<span class="inline-block px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider rounded-full">
							{home.visionLabel}
						</span>
					</div>
				{/if}
				
				<!-- Title -->
				{#if home.visionTitle}
					<h2 class="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
						{home.visionTitle}
					</h2>
				{/if}
				
				<!-- Vision Text -->
				<div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-white/20">
					<p class="text-base md:text-lg text-white leading-relaxed font-light">
						{home.visionText}
					</p>
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
{/if}


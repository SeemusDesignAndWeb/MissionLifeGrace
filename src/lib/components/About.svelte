<script>
	export let home = null;
</script>

<section id="about" class="py-20 bg-gradient-to-b from-white to-gray-50">
	<div class="container mx-auto px-4">
		<div class="max-w-6xl mx-auto">
			<div class="grid md:grid-cols-2 gap-12 items-center">
				<div class="order-2 md:order-1">
					{#if home?.aboutLabel}
						<div class="inline-block mb-4">
							<span class="text-primary text-sm font-semibold uppercase tracking-wider">{home.aboutLabel}</span>
						</div>
					{/if}
					{#if home?.aboutTitle}
						<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
							{@html home.aboutTitle}
						</h2>
					{/if}

					{#if home?.aboutContent}
						<div class="space-y-4 text-gray-700 leading-relaxed prose prose-lg max-w-none">
							{@html home.aboutContent}
						</div>
					{/if}
				</div>

				<div class="order-1 md:order-2 flex justify-center md:justify-end">
					<div class="relative w-full max-w-lg flex justify-center md:justify-end">
						<div class="relative">
							<!-- Circular decorative shape behind - same size as image, offset -->
							<div class="absolute w-80 h-80 md:w-96 md:h-96 bg-primary/20 rounded-full -top-2 -right-2 md:-top-3 md:-right-3"></div>
							<!-- Circular image -->
							<img
								src={home?.aboutImage || 'https://res.cloudinary.com/dsnceqtza/image/upload/v1763390998/mission-life-grace/375d5fb3-6856-49be-a8d1-48859a442bca.jpg'}
								alt="About us"
								class="relative rounded-full shadow-2xl w-80 h-80 md:w-96 md:h-96 object-cover z-10"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>


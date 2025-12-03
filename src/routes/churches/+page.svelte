<script lang="js">
	import PageRenderer from '$lib/components/PageRenderer.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import HeroSlides from '$lib/components/HeroSlides.svelte';

	export let data;
	export let params = {};
</script>

<svelte:head>
	<title>{data.page?.title || 'Churches'} - Mission Life Grace</title>
	<meta name="description" content={data.page?.metaDescription || data.page?.title || 'Mission Life Grace'} />
	{#if data.page?.keywords}
		<meta name="keywords" content={data.page.keywords} />
	{/if}
</svelte:head>

<!-- Hero Slides -->
<HeroSlides heroSlides={data.heroSlides} />

<PageRenderer page={data.page} contactInfo={data.contactInfo} />

<Footer />












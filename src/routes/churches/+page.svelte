<script lang="js">
	import PageRenderer from '$lib/components/PageRenderer.svelte';
	import Footer from '$lib/components/Footer.svelte';

	export let data;
	export let params = {};
</script>

<svelte:head>
	<title>{data.page.title} - Mission Life Grace</title>
	<meta name="description" content={data.page.metaDescription || data.page.title} />
</svelte:head>

<PageRenderer page={data.page} contactInfo={data.contactInfo} />

<Footer />



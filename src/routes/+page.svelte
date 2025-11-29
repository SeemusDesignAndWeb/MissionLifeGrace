<script>
	import { onMount } from 'svelte';
	import Hero from '$lib/components/Hero.svelte';
	import About from '$lib/components/About.svelte';
	import Vision from '$lib/components/Vision.svelte';
	import Team from '$lib/components/Team.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Conferences from '$lib/components/Conferences.svelte';
	import LatestMessagePopup from '$lib/components/LatestMessagePopup.svelte';

	export let data;
	export let params = {};

	let showLatestMessage = false;

	onMount(() => {
		// Show popup if enabled and data is available
		if (data.settings?.showLatestMessagePopup && data.latestVideo) {
			// Small delay to ensure page is loaded
			setTimeout(() => {
				showLatestMessage = true;
			}, 500);
		}
	});
</script>

<svelte:head>
	<title>Mission Life Grace - Churches on Mission Together</title>
	<meta name="description" content="Mission Life Grace - A network of churches on mission together to see the Kingdom of God come" />
</svelte:head>

<Hero heroSlides={data.heroSlides} featuredEvents={data.heroEvents} />
<About home={data.home} />
<Vision home={data.home} />
<Conferences conferences={data.heroConferences || []} />
<Contact contactInfo={data.contactInfo} />
<Footer contactInfo={data.contactInfo} />

<!-- Popups -->
<LatestMessagePopup 
	video={data.latestVideo} 
	open={showLatestMessage} 
	on:close={() => showLatestMessage = false} 
/>


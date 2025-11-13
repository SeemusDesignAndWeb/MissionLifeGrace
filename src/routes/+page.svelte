<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import About from '$lib/components/About.svelte';
	import Team from '$lib/components/Team.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import Testimonial from '$lib/components/Testimonial.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Eltham Green Community Church - EGCC</title>
	<meta name="description" content="Eltham Green Community Church - A welcoming community of faith in Eltham, London" />
</svelte:head>

<Navbar />
<Hero />
<About />
<Team />
<Menu />
<Testimonial />
<Contact />
<Footer />


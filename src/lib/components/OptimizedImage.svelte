<script>
	import { optimizeCloudinaryUrl } from '$lib/utils/images';

	export let src = '';
	export let alt = '';
	export let class: string = '';
	export let loading: 'lazy' | 'eager' = 'lazy';

	$: optimizedSrc = src ? optimizeCloudinaryUrl(src) : '';
</script>

<img src={optimizedSrc} alt={alt} class={class} loading={loading} />


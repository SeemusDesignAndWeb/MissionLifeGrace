<script lang="ts">
	function smoothScroll(e: MouseEvent, targetId: string) {
		e.preventDefault();
		const element = document.getElementById(targetId);
		if (element) {
			const offset = 49;
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - offset;
			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
	}
</script>

<footer
	id="footer"
	class="bg-cover bg-center bg-fixed py-20 text-white"
	style="background-image: url('/images/footer-open-hour-bg.jpg');"
>
	<div class="bg-black bg-opacity-60">
		<div class="container mx-auto px-4">
			<div class="grid md:grid-cols-12 gap-8">
				<!-- Find us -->
				<div class="md:col-span-3">
					<div class="section-title">
						<h2 class="text-white">Find us</h2>
					</div>
					<address class="not-italic text-gray-300">
						<p>
							Eltham Green Community Church<br />
							Eltham, London<br />
							SE9 1XX
						</p>
					</address>
				</div>

				<!-- Contact -->
				<div class="md:col-span-3">
					<div class="section-title">
						<h2 class="text-white">Contact</h2>
					</div>
					<address class="not-italic text-gray-300">
						<p>020 8850 3030</p>
						<p>
							<a href="mailto:info@egcc.co.uk" class="hover:text-primary transition-colors"
								>info@egcc.co.uk</a
							>
						</p>
						<p>
							<a href="mailto:hello@egcc.co.uk" class="hover:text-primary transition-colors"
								>hello@egcc.co.uk</a
							>
						</p>
					</address>
				</div>

				<!-- Service Times -->
				<div class="md:col-span-4">
					<div class="section-title">
						<h2 class="text-white">Service Times</h2>
					</div>
					<div class="text-gray-300 space-y-2">
						<div>
							<strong class="text-white">Sunday Worship</strong>
							<p>10:30 AM</p>
						</div>
						<div>
							<strong class="text-white">Bible Study</strong>
							<p>Wednesday 7:30 PM</p>
						</div>
						<div>
							<strong class="text-white">Prayer Meeting</strong>
							<p>Tuesday 7:00 PM</p>
						</div>
						<div>
							<strong class="text-white">Youth Group</strong>
							<p>Friday 7:00 PM</p>
						</div>
					</div>
				</div>

				<!-- Social & Copyright -->
				<div class="md:col-span-2">
					<ul class="flex gap-4 mb-8">
						<li>
							<a
								href="#"
								class="text-white hover:text-primary text-2xl transition-colors"
								aria-label="Facebook"
							>
								<i class="fa fa-facebook-square"></i>
							</a>
						</li>
						<li>
							<a
								href="#"
								class="text-white hover:text-primary text-2xl transition-colors"
								aria-label="Twitter"
							>
								<i class="fa fa-twitter"></i>
							</a>
						</li>
						<li>
							<a
								href="#"
								class="text-white hover:text-primary text-2xl transition-colors"
								aria-label="Instagram"
							>
								<i class="fa fa-instagram"></i>
							</a>
						</li>
						<li>
							<a
								href="#"
								class="text-white hover:text-primary text-2xl transition-colors"
								aria-label="Google"
							>
								<i class="fa fa-google"></i>
							</a>
						</li>
					</ul>

					<div class="text-gray-300 text-sm">
						<p>
							<br />Copyright &copy; {new Date().getFullYear()} <br />Eltham Green Community Church
							<br /><br />
							<a href="https://egcc.co.uk" class="hover:text-primary transition-colors"
								>egcc.co.uk</a
							>
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</footer>


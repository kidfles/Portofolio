// Jaar in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Kaart-template en grid
const grid = document.getElementById('project-grid');
const tpl = document.getElementById('project-card-template');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-image');
const lightboxMeta = document.getElementById('lightbox-meta');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxCloseBtn = document.querySelector('.lightbox-close');
const lightboxBackdrop = document.querySelector('.lightbox-backdrop');

let lightboxImages = [];
let lightboxIndex = 0;
let lightboxTitle = '';
let lightboxAlt = '';

function toggleBodyScroll(block){
  document.documentElement.style.overflow = block ? 'hidden' : '';
  document.body.style.overflow = block ? 'hidden' : '';
}

function updateLightbox(){
  if(!lightboxImages.length) return;
  lightboxImg.src = lightboxImages[lightboxIndex];
  lightboxImg.alt = lightboxAlt || lightboxTitle || 'Projectafbeelding';
  const label = lightboxImages.length > 1
    ? `Afbeelding ${lightboxIndex + 1} van ${lightboxImages.length}`
    : 'Projectafbeelding';
  lightboxMeta.textContent = lightboxTitle ? `${lightboxTitle} — ${label}` : label;
  const disableNav = lightboxImages.length <= 1;
  lightboxPrev.disabled = disableNav;
  lightboxNext.disabled = disableNav;
}

function openLightbox(images, startIndex = 0, altText = '', title = ''){
  if(!images || !images.length) return;
  lightboxImages = images;
  lightboxIndex = Math.min(Math.max(startIndex, 0), images.length - 1);
  lightboxAlt = altText;
  lightboxTitle = title;
  lightbox.hidden = false;
  lightbox.setAttribute('aria-hidden', 'false');
  updateLightbox();
  toggleBodyScroll(true);
}

function closeLightbox(){
  lightbox.hidden = true;
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImages = [];
  lightboxIndex = 0;
  lightboxTitle = '';
  lightboxAlt = '';
  toggleBodyScroll(false);
}

function shiftLightbox(delta){
  if(lightboxImages.length <= 1) return;
  lightboxIndex = (lightboxIndex + delta + lightboxImages.length) % lightboxImages.length;
  updateLightbox();
}

lightboxPrev?.addEventListener('click', () => shiftLightbox(-1));
lightboxNext?.addEventListener('click', () => shiftLightbox(1));
lightboxCloseBtn?.addEventListener('click', closeLightbox);
lightboxBackdrop?.addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => {
  if(lightbox.hidden) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowRight') shiftLightbox(1);
  if(e.key === 'ArrowLeft') shiftLightbox(-1);
});

async function loadProjects(){
  try{
    const res = await fetch('projects.json', {cache: 'no-store'});
    const data = await res.json();
    grid.setAttribute('aria-busy', 'false');

    data.projects.forEach(p => {
      const node = tpl.content.cloneNode(true);
      // Afbeelding
      const fallbackImage = p.image || 'images/placeholder.svg';
      let projectImages = Array.isArray(p.images) && p.images.length ? [...p.images] : [];
      if(!projectImages.length){
        projectImages = [fallbackImage];
      }else if(!projectImages.includes(fallbackImage)){
        projectImages.unshift(fallbackImage);
      }
      let selectedImageIndex = Math.max(0, projectImages.findIndex(src => src === fallbackImage));
      if(selectedImageIndex === -1) selectedImageIndex = 0;
      const img = node.querySelector('.card-img');
      img.src = fallbackImage;
      img.alt = p.imageAlt || p.title;
      img.addEventListener('click', () => {
        openLightbox(projectImages, selectedImageIndex, p.imageAlt || p.title, p.title);
      });

      // Image gallery (als er meerdere screenshots zijn)
      const gallery = node.querySelector('.image-gallery');
      if (gallery) {
        if (projectImages.length > 1) {
          projectImages.forEach((imageSrc, index) => {
            const thumb = document.createElement('button');
            thumb.className = 'gallery-thumb';
            thumb.type = 'button';
            thumb.setAttribute('aria-label', `Toon screenshot ${index + 1}`);
            if (index === selectedImageIndex) {
              thumb.classList.add('active');
            }
            const thumbImg = document.createElement('img');
            thumbImg.src = imageSrc;
            thumbImg.alt = '';
            thumbImg.loading = 'lazy';
            thumb.appendChild(thumbImg);
            
            thumb.addEventListener('click', () => {
              img.src = imageSrc;
              selectedImageIndex = index;
              gallery.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
              thumb.classList.add('active');
            });
            
            gallery.appendChild(thumb);
          });
        } else {
          gallery.remove();
        }
      }

      // Tekst
      node.querySelector('.card-title').textContent = p.title;
      node.querySelector('.card-tagline').textContent = p.tagline;
      node.querySelector('.card-summary').textContent = p.summary;

      // Highlights
      const ul = node.querySelector('.card-highlights');
      (p.highlights || []).forEach(h => {
        const li = document.createElement('li');
        li.textContent = h;
        ul.appendChild(li);
      });

      // Stack chips
      const chips = node.querySelector('.chip-row');
      (p.stack || []).forEach(s => {
        const span = document.createElement('span');
        span.className = 'chip';
        span.textContent = s;
        chips.appendChild(span);
      });

      // Links
      const demo = node.querySelector('.demo-link');
      const code = node.querySelector('.code-link');
      const cstudy = node.querySelector('.case-link');
      
      if (p.links?.demo && p.links.demo !== '#') {
        demo.href = p.links.demo;
      } else {
        demo.remove();
      }
      
      if (p.links?.repo && p.links.repo !== '#') {
        code.href = p.links.repo;
      } else {
        code.remove();
      }
      
      if (p.links?.caseStudy && p.links.caseStudy !== '#') {
        cstudy.href = p.links.caseStudy;
      } else {
        cstudy.remove();
      }

      grid.appendChild(node);
    });
  }catch(e){
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = '<p>Kon projecten niet laden. Controleer of <code>projects.json</code> aanwezig is.</p>';
    console.error(e);
  }
}

loadProjects();

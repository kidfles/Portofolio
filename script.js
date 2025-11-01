// Jaar in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Kaart-template en grid
const grid = document.getElementById('project-grid');
const tpl = document.getElementById('project-card-template');

async function loadProjects(){
  try{
    const res = await fetch('projects.json', {cache: 'no-store'});
    const data = await res.json();
    grid.setAttribute('aria-busy', 'false');

    data.projects.forEach(p => {
      const node = tpl.content.cloneNode(true);
      // Afbeelding
      const img = node.querySelector('.card-img');
      img.src = p.image || 'images/placeholder.svg';
      img.alt = p.imageAlt || p.title;

      // Image gallery (als er meerdere screenshots zijn)
      const gallery = node.querySelector('.image-gallery');
      if (gallery) {
        if (p.images && Array.isArray(p.images) && p.images.length > 1) {
          p.images.forEach((imageSrc, index) => {
            const thumb = document.createElement('button');
            thumb.className = 'gallery-thumb';
            thumb.type = 'button';
            thumb.setAttribute('aria-label', `Toon screenshot ${index + 1}`);
            if (imageSrc === p.image) {
              thumb.classList.add('active');
            }
            const thumbImg = document.createElement('img');
            thumbImg.src = imageSrc;
            thumbImg.alt = '';
            thumbImg.loading = 'lazy';
            thumb.appendChild(thumbImg);
            
            thumb.addEventListener('click', () => {
              img.src = imageSrc;
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

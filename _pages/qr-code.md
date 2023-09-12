---
title: QR Code in HippoPenny's eyes
layout: archive
permalink: /qr-code/
show_excerpts: true
sort_order: reverse
sort_by: date
author_profile: false
---

<style>
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Adjust minmax width as needed */
    grid-gap: 20px; /* Adjust gap between items */
    text-align: center;
    max-width: 4800px; /* Set a maximum width for the container */
  }

  .gallery img {
    max-width: 100%;
    height: auto;
    cursor: pointer; /* Add a pointer cursor to indicate clickability */
  }

  .gallery .caption {
    text-align: center;
  }
</style>

<script src="{{ '/assets/lightbox2/lightbox.js' | relative_url }}"></script>
<link href="{{ '/assets/lightbox2/lightbox.css' | relative_url }}" rel="stylesheet" />

QR codes that not only scan seamlessly but also capture the personalized style of a company or individual with our gen AI. All are free to use. 
Reach out to us at *biz@hippopenny.com* to get yours.

<div class="gallery">
  {% for file in site.static_files %}
    {% if file.path contains '/assets/images/qr-code/' and file.path contains '.png' %}
        <div class="gallery-item">
          <a href="{{ file.path }}" data-lightbox="image-set" data-title="{{ file.name | remove: '.png' | replace: '-', ' ' }}">
            <img src="{{ file.path }}" alt="{{ file.name | remove: '.png' | replace: '-', ' ' }}"/>
          </a>
          <div class="caption">{{ file.name | remove: '.png' | remove: '.jpg' | replace: '-', ' ' }}</div>
        </div>
    {% endif %}
  {% endfor %}
</div>

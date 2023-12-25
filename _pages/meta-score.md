---
title: HippoPenny Score
layout: scores
permalink: /meta-score/
show_excerpts: true
sort_order: reverse
sort_by: date
author_profile: false
---

<style>
 .gallery-item {
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin: 20px;
    width: 20%;

}

.gallery-item img {
    
    height: auto;
    display: block;
    transition: transform 0.3s ease-in-out;
}

.gallery-item:hover img {
    transform: scale(1.1);
}

.caption {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 8px;
    color: #fff;
    text-align: center;
    transition: 0.3s ease-in-out;
    opacity: 0;
}

.gallery-item:hover .caption {
    opacity: 1;
}
  a{
    color :black;
    text-decoration:none;
  }
</style>

<script src="{{ '/assets/lightbox2/lightbox.js' | relative_url }}"></script>
<link href="{{ '/assets/lightbox2/lightbox.css' | relative_url }}" rel="stylesheet" />


<div class="gallery">
  {% for file in site.static_files %}
    {% if file.path contains '/scores/' and file.path contains '.png' %}
        <div class="gallery-item">
          <a href="{{ file.path }}" data-lightbox="image-set" data-title="{{ file.name | remove: '.png' | replace: '-', ' ' }}">
            <img src="{{ file.path }}" alt="{{ file.name | remove: '.png' | replace: '-', ' ' }}"/>
          </a>
          <div class="caption">
         <a href="{{ file.name | remove: '.png' | remove: '.jpg' | '' | slice: 11, file.name.size }}" style="color: #000000;text-transform: uppercase;">{{ file.name | remove: '.png' | remove: '.jpg' | replace: '-', ' '| slice: 11, page.name.size   }}</a>
         </div>
        </div>
    {% endif %}
  {% endfor %}
</div>

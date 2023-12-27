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
 .gallery {
  justify-content: center;
  align-items: center;
  text-align: center;
   flex-wrap: wrap;
  
  
}

.gallery-item {
 display: flex;
  flex-direction: column; /* Sắp xếp theo chiều dọc */
  justify-content: center;
  align-items: center;
  text-align: center;
  align-items: center; /* Center items along the horizontal axis */
  position: relative;
  overflow: hidden;
  margin: 0 40px;
    
 
}

.gallery-item img {
    border-radius: 8px; 
    height: auto;
    display: block;
    transition: transform 0.3s ease-in-out;
    

}

.gallery-item:hover img {
    transform: scale(1.03);
}
.caption {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Bắt đầu từ bên trái */
  text-align: left;
  color: #fff;
  max-width: 100%;
  margin-top:1rem;
}
.top-caption {
  display: flex;
  justify-content: space-between; /* Để các phần tử con căn cách nhau hết sức có thể */
}

.caption-container {
   display: flex;
}



.caption-container p {
  order: 2; /* Đặt phần tử <p> xuống dưới */
}

.caption1 {
 font-size: 12px;
    color: black;
    background-color: #00f20d;
    border-radius: 3px;
    padding: 5px 5px;
  
  
}

.caption2 {
  font-size: 10px;
  color: black;
}
  .underline{
   text-decoration: underline; /* Thêm gạch chân dưới cho class "v" */
  text-decoration-thickness: 0.5px; /* Độ dày của đường gạch chân dưới */
  }

  a{
    color :black;
  
  }
  .top-caption{
    display:flex;
  }

 @media only screen and (min-width: 658px) {
  .caption {
    width: 40%; 
  }
}


</style>

<script src="{{ '/assets/lightbox2/lightbox.js' | relative_url }}"></script>
<link href="{{ '/assets/lightbox2/lightbox.css' | relative_url }}" rel="stylesheet" />






<div class="gallery">
{% assign index = 0 %}
  {% for file in site.static_files %}
    {% if file.path contains '/scores/' and file.path contains '.png' %}
        <div class="gallery-item">
          <a href="{{ file.path }}" data-lightbox="image-set" data-title="{{ file.name | remove: '.png' | replace: '-', ' ' }}">
            <img src="{{ file.path }}" alt="{{ file.name | remove: '.png' | replace: '-', ' ' }}"/>
          </a>
             {% capture dataFileName %}{{ file.name | remove: '.png' | slice: 11, file.name.size }}{% endcapture %}
             {% assign jsonData = site.data[dataFileName] %}
             {% assign score = jsonData.meta-review.score | round %}
          <div class="caption">
               <div class="top-caption">
    <a href="{{ file.name | remove: '.png' | remove: '.jpg' | '' | slice: 11, file.name.size }}" style="color: #000000;text-transform: uppercase;">
      {{ file.name | remove: '.png' | remove: '.jpg'| slice: 11, page.name.size | replace: '-', ' '  }}
    </a> 
</div> 
 <div class="caption-container">
    <p id="caption1-{{index}}" class="caption1">{{ score }}</p>
    <p id="caption1.2-{{index}}" style="
    color: black;
    font-size: 14px; margin-left:5px;
" >...</p>
  </div>
          <p class="caption2">{{jsonData.meta-review.comment  | slice: 0, 360}}...</p>
         </div>
        </div>
     {% assign index = index | plus: 1 %}

    {% endif %}
  {% endfor %}
        <p id="indexx" style="display:none;">{{index}}</p>

</div>

<script>

  var indexx = document.getElementById('indexx').textContent;

  for(let i = 0; i < indexx ; i ++){
    const score = document.getElementById(`caption1-${i}`).textContent
    if(score > 90){
      document.getElementById(`caption1.2-${i}`).innerHTML = "Universal Acclaim"
    }else{
      if(score > 70){
        document.getElementById(`caption1.2-${i}`).innerHTML = "Generally Favorable"
      }else{
           document.getElementById(`caption1.2-${i}`).innerHTML  = "Mixed or Average"
      }
    }
  }

</script>


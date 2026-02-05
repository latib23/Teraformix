import{c as f,g as p,b as u,r as i,j as e,d as c}from"./index-CFXgF25F.js";import g from"./Header-C_SW7nKS.js";import x from"./Footer-B1Tu_7x4.js";import{S as y}from"./SEOHead-B9VOB5E2.js";import{A as b}from"./arrow-left-Ca1M9LpJ.js";import{C as j}from"./calendar-C6jeWWk-.js";import{U as w}from"./user-B-hCEkTO.js";import"./mail-BAG_jpJT.js";import"./phone-BECx4-5W.js";import"./Image-1076sJ0o.js";import"./log-out-DrwdvGzO.js";import"./upload-Bi7gtjrF.js";import"./shopping-cart-DYMnb0eQ.js";import"./shield-check-Cy8fN0mD.js";import"./award-B6s_1h76.js";import"./lock-Cz0cqC_5.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=f("Share2",[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]]),U=()=>{const{slug:m}=p(),{content:l}=u(),t=i.useMemo(()=>(l.blogPosts||[]).find(o=>o.slug===m),[l.blogPosts,m]),d=i.useMemo(()=>t?(l.blogPosts||[]).filter(o=>o.isPublished&&o.id!==t.id).slice(0,3):[],[l.blogPosts,t]);i.useEffect(()=>{const o="blog-content-inline-style";if(!document.getElementById(o)){const r=document.createElement("style");r.id=o,r.textContent=`
        .blog-content {
          color: #1f2937;
          line-height: 1.8;
          font-size: 1.0625rem;
        }

        /* Typography */
        .blog-content h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #0b1b3f;
          margin: 2rem 0 1rem;
          line-height: 1.2;
        }
        .blog-content h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0b1b3f;
          margin: 1.75rem 0 1rem;
          line-height: 1.3;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        .blog-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0b1b3f;
          margin: 1.5rem 0 0.75rem;
          line-height: 1.4;
        }
        .blog-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 1.25rem 0 0.75rem;
        }

        .blog-content p {
          margin-bottom: 1.25rem;
          color: #374151;
        }

        /* Links */
        .blog-content a {
          color: #15803d;
          text-decoration: underline;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .blog-content a:hover {
          color: #166534;
          text-decoration-thickness: 2px;
        }

        /* Lists */
        .blog-content ul, .blog-content ol {
          margin: 1.25rem 0;
          padding-left: 2rem;
        }
        .blog-content ul {
          list-style-type: disc;
        }
        .blog-content ol {
          list-style-type: decimal;
        }
        .blog-content li {
          margin-bottom: 0.5rem;
          color: #374151;
        }

        /* Blockquotes */
        .blog-content blockquote {
          border-left: 4px solid #15803d;
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #4b5563;
          background: #f9fafb;
          padding: 1rem 1.5rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        /* Images */
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          margin: 1.5rem 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* Tables */
        .blog-content .table-scroll {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .blog-content table {
          width: 100%;
          min-width: 640px;
          border-collapse: collapse;
          background: #fff;
        }
        .blog-content thead {
          background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
        }
        .blog-content th {
          border: 1px solid #e5e7eb;
          padding: 0.875rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #0b1b3f;
          font-size: 0.9375rem;
        }
        .blog-content td {
          border: 1px solid #e5e7eb;
          padding: 0.875rem 1rem;
          color: #374151;
          font-size: 0.9375rem;
        }
        .blog-content tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        .blog-content tbody tr:hover {
          background: #f3f4f6;
        }

        /* Code */
        .blog-content pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 1.25rem;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          overflow-x: auto;
          line-height: 1.6;
          font-size: 0.9375rem;
          border: 1px solid #1e293b;
        }
        .blog-content code {
          font-family: 'Courier New', Courier, monospace;
        }
        .blog-content :not(pre) > code {
          background: #f1f5f9;
          color: #dc2626;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Horizontal Rule */
        .blog-content hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }

        /* Strong/Bold */
        .blog-content strong {
          font-weight: 600;
          color: #0b1b3f;
        }

        /* Emphasis/Italic */
        .blog-content em {
          font-style: italic;
        }
      `,document.head.appendChild(r)}const a=document.querySelector(".blog-content");a&&a.querySelectorAll("table").forEach(r=>{const n=r.parentElement;if(n&&n.classList.contains("table-scroll"))return;const s=document.createElement("div");s.className="table-scroll",n==null||n.insertBefore(s,r),s.appendChild(r)})},[t==null?void 0:t.content]);const h=async()=>{const o=window.location.href,a={title:(t==null?void 0:t.title)||"Blog Post",text:(t==null?void 0:t.excerpt)||"",url:o};try{navigator.share?await navigator.share(a):(await navigator.clipboard.writeText(o),alert("Link copied to clipboard!"))}catch(r){console.error("Share failed:",r)}};return!t||!t.isPublished?e.jsxs("div",{className:"min-h-screen bg-gray-50 flex flex-col",children:[e.jsx(g,{}),e.jsx("main",{className:"flex-grow flex items-center justify-center py-20",children:e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6",children:e.jsx("svg",{className:"w-10 h-10 text-gray-400",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})}),e.jsx("h1",{className:"text-2xl font-bold text-navy-900 mb-2",children:"Post Not Found"}),e.jsx("p",{className:"text-gray-600 mb-6",children:"The article you're looking for doesn't exist or has been removed."}),e.jsxs(c,{to:"/blog",className:"inline-flex items-center gap-2 text-action-600 font-semibold hover:text-action-700",children:[e.jsx(b,{className:"w-4 h-4"}),"Back to Blog"]})]})}),e.jsx(x,{})]}):e.jsxs("div",{className:"min-h-screen bg-gray-50 flex flex-col",children:[e.jsx(y,{title:t.metaTitle||`${t.title} | Blog | Server Tech Central`,description:t.metaDescription||t.excerpt||t.title,canonicalUrl:`https://servertechcentral.com/blog/${t.slug}`,image:t.image,type:"article"}),e.jsx(g,{}),e.jsxs("main",{className:"flex-grow",children:[e.jsx("div",{className:"bg-white border-b border-gray-200",children:e.jsx("div",{className:"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4",children:e.jsxs(c,{to:"/blog",className:"inline-flex items-center gap-2 text-sm text-action-600 hover:text-action-700 font-medium transition-colors",children:[e.jsx(b,{className:"w-4 h-4"}),"Back to All Articles"]})})}),e.jsx("article",{className:"bg-white",children:e.jsxs("div",{className:"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6",children:[t.publishDate&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(j,{className:"w-4 h-4 text-gray-400"}),e.jsx("time",{dateTime:t.publishDate,children:new Date(t.publishDate).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})})]}),t.author&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(w,{className:"w-4 h-4 text-gray-400"}),e.jsxs("span",{children:["By ",t.author]})]}),e.jsxs("button",{onClick:h,className:"ml-auto flex items-center gap-2 text-action-600 hover:text-action-700 font-medium transition-colors",children:[e.jsx(v,{className:"w-4 h-4"}),"Share"]})]}),e.jsx("h1",{className:"text-4xl md:text-5xl font-bold text-navy-900 mb-6 leading-tight",children:t.title}),t.excerpt&&e.jsx("p",{className:"text-xl text-gray-600 leading-relaxed mb-8 pb-8 border-b border-gray-200",children:t.excerpt}),t.image&&e.jsx("div",{className:"mb-8",children:e.jsx("img",{src:t.image,alt:t.title,className:"w-full h-auto max-h-[500px] object-cover rounded-xl border border-gray-200 shadow-lg"})}),e.jsx("div",{className:"blog-content max-w-none",dangerouslySetInnerHTML:{__html:t.content}})]})}),d.length>0&&e.jsx("div",{className:"bg-gray-50 border-t border-gray-200",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16",children:[e.jsx("h2",{className:"text-2xl font-bold text-navy-900 mb-8",children:"Related Articles"}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-8",children:d.map(o=>e.jsxs(c,{to:`/blog/${o.slug}`,className:"group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow",children:[o.image?e.jsx("div",{className:"h-40 overflow-hidden bg-gray-100",children:e.jsx("img",{src:o.image,alt:o.title,className:"w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"})}):e.jsx("div",{className:"h-40 bg-gradient-to-br from-navy-100 to-action-50"}),e.jsxs("div",{className:"p-5",children:[e.jsx("h3",{className:"font-bold text-navy-900 mb-2 line-clamp-2 group-hover:text-action-600 transition-colors",children:o.title}),o.excerpt&&e.jsx("p",{className:"text-sm text-gray-600 line-clamp-2",children:o.excerpt})]})]},o.id))})]})})]}),e.jsx(x,{})]})};export{U as default};

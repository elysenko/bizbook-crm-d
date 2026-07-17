# syntax=docker/dockerfile:1
# Placeholder image for an empty scaffolded repo — serves a static "awaiting code" page.
FROM nginx:1.27-alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 8080
# Rewrite nginx default port from 80 → 8080 so the container matches the k8s Service targetPort.
RUN sed -i 's/listen\s\+80;/listen 8080;/' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]

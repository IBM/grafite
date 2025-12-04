FROM python:3.12

WORKDIR /app
COPY . .

RUN pip install .


EXPOSE 29007
CMD ["uvicorn", "grafite.serve.controller:app", "--host=0.0.0.0" , "--port", "29007"]
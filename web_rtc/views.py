from django.shortcuts import render


def index(request):
    """
    Test end point
    # TODO change to APIVIew
    """

    return render(request, "index.html")